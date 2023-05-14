ymaps.ready(init);

function init() {
    var myMap = new ymaps.Map('map', {
            center: [54.493666, 20.332235],
            zoom: 10
        }, {
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

    const getData = (data) => {
        data.features.forEach(el => {
            // Добавление всех категорий в productTypes
            categories.add(el.properties.balloonContent)
            types.add(el.properties.clusterType)
            locations.add(el.properties.clusterLocation)
        })

        // рендер в кастомный фильтр
        function render(sets, box, filter) {
            sets.forEach(el => {
                box.insertAdjacentHTML('beforeend', categoryTemplate(el))
            });
        }

        render(categories, categoryBox);
        render(types, type);
        render(locations, location);

        const inputInn = document.querySelector("[data-inn]");
        const inputName = document.querySelector("[data-name]");
        const inputs = document.querySelectorAll("[data-check]");

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
        })
    }

    const categoryTemplate = (productType) => {
        return `
        <label class="check">
            <input type="checkbox" name="filterType" value="${productType}" checked data-check>
            ${productType}
        </label>
    `
    }

    fetch('../data.json')
        .then(response => response.json())
        .then(response => {
            getData(response);
            objectManager.add(response)
        })

}