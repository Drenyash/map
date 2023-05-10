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

    const productTypes = new Set();

    const getData = (data) => {
        data.features.forEach(el => {
            productTypes.add(el.properties.balloonContent)
        })
        productTypes.forEach(el => {
            categoryBox.insertAdjacentHTML('beforeend', categoryTemplate(el))
        });

        // Создадим 5 пунктов выпадающего списка.
        var listBoxItems = [...productTypes]
                .map(function (title) {
                    return new ymaps.control.ListBoxItem({
                        data: {
                            content: title
                        },
                        state: {
                            selected: true
                        }
                    })
                }),
            reducer = function (filters, filter) {
                filters[filter.data.get('content')] = filter.isSelected();
                return filters;
            },
            // Теперь создадим список, содержащий 5 пунктов.
            listBoxControl = new ymaps.control.ListBox({
                data: {
                    content: 'Фильтр',
                    title: 'Фильтр'
                },
                items: listBoxItems,
                state: {
                    // Признак, развернут ли список.
                    expanded: true,
                    filters: listBoxItems.reduce(reducer, {})
                }
            });
        myMap.controls.add(listBoxControl);

        // Добавим отслеживание изменения признака, выбран ли пункт списка.
        listBoxControl.events.add(['select', 'deselect'], function (e) {
            var listBoxItem = e.get('target');
            var filters = ymaps.util.extend({}, listBoxControl.state.get('filters'));
            filters[listBoxItem.data.get('content')] = listBoxItem.isSelected();
            listBoxControl.state.set('filters', filters);
        });

        var filterMonitor = new ymaps.Monitor(listBoxControl.state);
        filterMonitor.add('filters', function (filters) {
            // Применим фильтр.
            objectManager.setFilter(getFilterFunction(filters));
        });

        function getFilterFunction(categories) {
            return function (obj) {
                var content = obj.properties.balloonContent;
                return categories[content]
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

    // -----------------------------------

    $.ajax({
        url: "data.json"
    }).done(function (data) {
        getData(data);
        objectManager.add(data);
    });

}