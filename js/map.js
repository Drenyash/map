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
            gridSize: 32,
            clusterDisableClickZoom: true
        });

    // Чтобы задать опции одиночным объектам и кластерам,
    // обратимся к дочерним коллекциям ObjectManager.
    objectManager.objects.options.set('preset', 'islands#greenDotIcon');
    objectManager.clusters.options.set('preset', 'islands#greenClusterIcons');
    myMap.geoObjects.add(objectManager);

    // -----------------------------------

    const categoryBox = document.querySelector("[data-filter-category]");

    // переменная для хранения униклаьных категорий
    const productTypes = new Set();

    const getData = (data) => {
        data.features.forEach(el => {
            // Добавление всех категорий в productTypes
            productTypes.add(el.properties.balloonContent)
        })
        // рендер в кастомный фильтр категорий
        productTypes.forEach(el => {
            categoryBox.insertAdjacentHTML('beforeend', categoryTemplate(el))
        });

        const categoryInputs = document.querySelectorAll("[data-check]");
        let filters = [...productTypes];
        categoryInputs.forEach(input => {
            input.addEventListener('change', (evt) => {
                if (!evt.target.checked) {
                    filters.splice(filters.indexOf(evt.target.value), 1)
                } else {
                    filters.push(evt.target.value)
                }
                objectManager.setFilter(getFilterFunction(filters));
            })
            objectManager.setFilter(getFilterFunction(filters));
        })


        function getFilterFunction(categories) {
            return (obj) => {
                const content = obj.properties.balloonContent;
                for (let category of categories) {
                    if (category === content) {
                        return category
                    }
                }
            }
        }


    }

    const categoryTemplate = (productType) => {
        return `
        <label class="check">
            <input type="checkbox" name="animal" value="${productType}" checked data-check>
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