import Chart from 'chart.js/auto'
import {log10} from "chart.js/helpers";

ymaps.ready(init);

const url = 'http://localhost:3001/features';

function init() {
    var myMap = new ymaps.Map('map', {
            center: [54.493666, 20.332235],
            zoom: 10,
            behaviors: ["drag", "dblClickZoom", "rightMouseButtonMagnifier", "multiTouch"]
        }, {
            restrictMapArea: [
                [55.343980, 19.788975],
                [53.953973, 23.310124]
            ],
            searchControlProvider: 'yandex#search'
        }),
        objectManager = new ymaps.ObjectManager({
            // Чтобы метки начали кластеризоваться, выставляем опцию.
            clusterize: true,
            // ObjectManager принимает те же опции, что и кластеризатор.
            gridSize: 64,
            clusterDisableClickZoom: true
        });

    // Чтобы задать опции одиночным объектам и кластерам,
    // обратимся к дочерним коллекциям ObjectManager.
    objectManager.objects.options.set('preset', 'islands#greenDotIcon');
    objectManager.clusters.options.set('preset', 'islands#greenClusterIcons');
    myMap.geoObjects.add(objectManager);

    // -----------------------------------

    const categoryBox = document.querySelector("[data-filter-category]");
    const type = document.querySelector("[data-filter-type]");
    const location = document.querySelector("[data-filter-location]");

    // переменная для хранения уникальных значений
    const categories = new Set();
    const types = new Set();
    const locations = new Set();
    let totalCount = {};
    let totalCountArray = [];
    let activeLocation = '';
    const ctx = document.getElementById('myChart').getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'bar',
        data: [],
        options: {}
    });

    const getData = (data) => {
        data.forEach(el => {
            // Добавление всех категорий в productTypes
            categories.add(el.properties.balloonContent)
            types.add(el.properties.clusterType)
            locations.add(el.properties.clusterLocation)
        })

        // рендер в кастомный фильтр
        function render(sets, box) {
            sets.forEach(el => {
                box.insertAdjacentHTML('beforeend', categoryTemplate(el))
            });
        }

        function renderCharts(sets, box) {
            sets.forEach(el => {
                box.insertAdjacentHTML('beforeend', chartsTemplate(el))
            });
        }

        render(categories, categoryBox);
        render(types, type);
        renderCharts(locations, location);

        const inputInn = document.querySelector("[data-inn]");
        const inputName = document.querySelector("[data-name]");
        const inputs = document.querySelectorAll("[data-check]");
        const charts = document.querySelectorAll("[data-chart]");
        const chartContainer = document.getElementById('myChart');

        let mainFilter = [...categories, ...types, ...locations];

        function getFilterFunction(values) {
            return (obj) => {
                if (values.includes(obj.properties.clusterType) && values.includes(obj.properties.balloonContent) && values.includes(obj.properties.clusterLocation)) {
                    return obj;
                }
            }
        }

        // Проверяем категорию
        inputs.forEach(input => {
            input.addEventListener('change', (evt) => {
                if (!evt.target.checked) {
                    mainFilter.splice(mainFilter.indexOf(evt.target.value), 1)
                } else {
                    mainFilter.push(evt.target.value)
                }
                objectManager.setFilter(getFilterFunction(mainFilter));
            })
            objectManager.setFilter(getFilterFunction(mainFilter));
        })

        charts.forEach(chart => {
            chart.addEventListener('change', (evt) => {
                charts.forEach(el => el.checked = false)
                chart.checked = true
                if (!chartContainer.classList.contains('active'))
                    chartContainer.classList.add('active')
                activeLocation = evt.target.value
                updateChart(data, myChart)
            })
        })

        // Проверяем ИНН
        inputInn.addEventListener('change', (evt) => {
            let chars = evt.target.value;
            objectManager.setFilter((obj) => {
                return obj.properties.clusterInn === chars
            })
            if (chars.length === 0) {
                objectManager.setFilter();
            }
        })
        // Проверяем название организации
        inputName.addEventListener('input', (evt) => {
            let chars = evt.target.value;
            objectManager.setFilter((obj) => {
                if (obj.properties.clusterCaption.indexOf(chars) !== -1) {
                    return obj.properties.clusterCaption
                }
            })
            if (chars.length === 0) {
                objectManager.setFilter();
            }
        });
        createChart(data)
    }

    const categoryTemplate = (productType) => {
        return `
        <label class="check">
            <input type="checkbox" name="filterType" value="${productType}" checked data-check>
            ${productType}
        </label>
    `
    }

    const chartsTemplate = (productType) => {
        return `
        <label class="check">
            <input type="checkbox" name="filterType" value="${productType}" data-chart>
            ${productType}
        </label>
    `
    }

    fetch(url)
        .then(response => response.json())
        .then(response => {
            getData(response);
            objectManager.add(response)
        })


    function createChart(data) {

        // Определите ваш массив данных JSON
        const dataChart = {
            labels: [],
            datasets: [{
                label: activeLocation,
                data: [], // Данные на вывод
                backgroundColor: 'rgba(0, 123, 255, 0.5)', // Замените цвет на необходимый
                borderColor: 'rgba(0, 123, 255, 1)', // Замените цвет на необходимый
                borderWidth: 1
            }]
        };

        dataChart.labels = [...categories];

        dataChart.datasets[0].data = new Array(dataChart.labels.length).fill(0)

        myChart.data = dataChart

        countAllStructures(data, myChart)

        myChart.update()
    }

    function countAllStructures(data, chart) {
        data.forEach(element => {
            // Проверка элемента на принадлежность к активному району
            if (activeLocation == 'Калининградская Область') {
                if (totalCount.hasOwnProperty(element.properties.balloonContent)) {
                    totalCount[element.properties.balloonContent] += 1;
                } else {
                    totalCount[element.properties.balloonContent] = 1;
                }
            }
            if (element.properties.clusterLocation === activeLocation) {
                if (totalCount.hasOwnProperty(element.properties.balloonContent)) {
                    totalCount[element.properties.balloonContent] += 1;
                } else {
                    totalCount[element.properties.balloonContent] = 1;
                }
            }
        })
        totalCountArray = Object.entries(totalCount);
        console.log(totalCountArray)

        totalCountArray.forEach((el, idx) => {
            chart.data.datasets[0].data[chart.data.labels.indexOf(el[0])] = el[1];
        })
    }

    function updateChart(data, myChart) {
        myChart.data.datasets[0].data = new Array(16).fill(0)
        totalCount = {};

        countAllStructures(data, myChart)

        myChart.data.datasets[0].label = activeLocation;
        myChart.update()
    }
}
