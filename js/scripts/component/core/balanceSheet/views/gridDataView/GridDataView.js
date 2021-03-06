/**
 * Created by fabrizio on 7/7/14.
 */
define(["jquery" , "views/modelView/ViewModel", "adapterGrid", "nprogress", "webix"], function ($, ViewModel, AdapterGrid, Nprogress) {

    var model, table, Configurator, titlesUp, titlesLeft, accessorMap, fullModel, configurationKeys, indexValues, modelView,
        leftDimensions, upDimensions, valueColumn, language, viewModel, adapterGrid, supportUtility,
        dataSource, columns ,arrDiffDates, grid, generalController, NProgress

    function GridDataView2() {

        NProgress = Nprogress
        NProgress.done()
    }


    GridDataView2.prototype.init = function (tableModel, configurator, utility, GeneralController) {

        generalController = GeneralController;
        supportUtility = utility
        adapterGrid = new AdapterGrid;
        viewModel = new ViewModel;
        table = tableModel;
        Configurator = configurator;
        language = Configurator.getComponentLanguage();
        var grid = this.createFullGrid();
        return grid;
    }

    GridDataView2.prototype.createFullGrid = function () {

        fullModel = Configurator.getAllColumnModels();
        configurationKeys = Configurator.getKeyColumnConfiguration();
        accessorMap = Configurator.getAccessorMap();
        valueColumn = Configurator.getValueColumnConfiguration();
        indexValues = Configurator.getValueIndex();
        modelView = viewModel.init(table, Configurator, supportUtility)
        var grid = this.renderGrid(modelView)
        return grid;
    }

    GridDataView2.prototype.renderGrid = function (model) {
        adapterGrid.createPropertiesFromModel(model)
        var columnsNumber = adapterGrid.getNumberOfColumns(model)
        var differentDates = adapterGrid.getDifferentDates();
        var titlesMap = adapterGrid.getTitlesMap()

        dataSource = this.createDataSource(columnsNumber, differentDates, titlesMap, model)

        columns = this.createColumns(dataSource, differentDates)

       this.createOtherOptions()

        if(grid)
            grid.destructor()

        var self = this;
        grid =
            webix.ui({
                container: "pivotGrid",
                view: "datatable",
                navigation:true,
                clipboard:"selection",
                id: "grid",
                editable:true,
                leftSplit:1,
                scheme: {
                    $change: function (item) {
                        self.createColourConfiguration(item);
                    }
                },
                columns: columns,
                datatype: "jsarray",
                data: dataSource
            });


        generalController.createListeners(grid);

        return grid;
    }

    GridDataView2.prototype.createOtherOptions = function(){
        var filterData = supportUtility.getFilterData()

        document.getElementById('box').style.visibility = "visible";
        var options = document.getElementById('options')
        options.style.visibility = "visible";
        var toappend = document.getElementById('toAppend');
        if (toappend != null) {
            toappend.remove()
        }

        var f = document.getElementById('optionsPivotGrid');
        if (typeof f != 'undefined' && f != null) {
            f.remove();
        }

        var f = document.getElementById('newForecast');
        if (typeof f != 'undefined' && f != null) {
            f.remove();
        }

        var fa = document.querySelectorAll('[view_id="grid"]');
        if (typeof fa != 'undefined' && fa != null) {
            fa.remove();
        }

        var titleGrid = document.getElementById('titlepivotGrid')
        titleGrid.innerHTML = "Forecast for season: "+filterData.season+" , "+filterData.country+
            " , "+filterData.product+" , "+filterData.dataSource

        $('#options').append('<div class="btn-group"><button class="btn btn-primary" id="newForecast">Create a new forecast for season '+filterData.season+'</button></div><div class="btn-group-vertical" id="optionsPivotGrid">' +
            '<button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown">' +
            '<span class="caret"></span><span>Options</span></button>' +
            '<ul class="dropdown-menu" role="menu"><li>' +
            '<div class="row"><div class="col-lg-1"><div id="editingChoice"/></div>' +
            '<div class="col-lg-9"><span>Edit flag and notes</span></div></div><hr></li></ul></div>') ;
        $('#editingChoice').jqxCheckBox({width: 30, height: 25});

    }

    GridDataView2.prototype.createColourConfiguration = function(item){
        switch(item.data0) {
            case 'Population (1000s)':
            case 'Total Supply (Thousand tonnes)':
            case 'Domestic Supply (Thousand tonnes)':
            case 'Opening Stocks (Thousand tonnes)':
            case 'Total Utilization (Thousand tonnes)':
            case 'Domestic Utilization (Thousand tonnes)':
            case 'Per capita food use (Kg/Yr)':
            case 'Extraction Rate (%)':
                item.$css = "blueLine"
                break;

            case 'Unbalanced':
                item.$css = "redLine"
                break;

            case 'Production (Thousand tonnes)':
            case 'Other Uses (Thousand tonnes)':
            case 'Area Harvested (Thousand Ha)':
            case 'Production Paddy (Thousand tonnes)':
            case 'Area Planted (Thousand Ha)':
            case 'Yield (Tonnes/Ha)':
            case 'Yield Paddy (Tonnes/Ha)':
            case 'Yield Milled (Tonnes/Ha)':
                item.$css = "greenLine"
                break;

            default :
                item.$css = "defaultLine"
                break;

        }
    }

    GridDataView2.prototype.createColumns = function(dataSource, differentDates){
            var filterData = supportUtility.getFilterData()

            var columns = [];
            arrDiffDates = Object.keys(differentDates)

            columns.push({id : "data0",width:400,header:'Elements', css:"firstColumn" })

            for(var i =0; i< arrDiffDates.length; i++){
                if(i==0) {
                    columns.push({id: "data" + 1, header: [
                   //   {text: ''},
                        {text: 'Input dates' ,colspan: arrDiffDates.length},
                        {text: arrDiffDates[i]}
                    ], editor: 'text'})
                }else{
                    if(i == arrDiffDates.length -1){

                    }
                    columns.push({id: "data" + (i+1),header: [
                      //{text: ''},
                        {text: null},
                        {text: arrDiffDates[i]}], editor: 'text'})
                }
            }
            return columns;
        }

    GridDataView2.prototype.createDataSource = function(columnsNumber,differentDates,titlesMap, model  ){

        var viewRowModel = []
        var index =0;
        for(var key in titlesMap){
            viewRowModel[index] = [key];
            for(var i =0; i<titlesMap[key].length; i++){
                var indexValue = titlesMap[key][i]
                viewRowModel[index].push(model[indexValue][3])
            }
            index++;
        }

        return viewRowModel;
    }

    GridDataView2.prototype.updateGridView = function (newCell, indexCell, xCoordinate, yCoordinate) {

        var cellTransformed = viewModel.updateItem(newCell)
        modelView[indexCell] = cellTransformed;

        var result =this.updateDataSourceSingleCell(cellTransformed)

        grid.destructor()

        var self = this;
        grid =
            webix.ui({
                container: "pivotGrid",
                view: "datatable",
                navigation:true,
                id: "grid",
                editable:true,
                clipboard:"selection",
                leftSplit:1,
                scheme: {
                    $change: function (item) {
                        self.createColourConfiguration(item);
                    }
                },
                columns: columns,
                datatype: "jsarray",
                data: dataSource
            });
        window.scrollTo(xCoordinate,yCoordinate)

        generalController.createListeners(grid)

    }

    GridDataView2.prototype.getGrid = function(){
        return grid
    }

    GridDataView2.prototype.updateBatchGridView = function (tableModel, cells, xCoordinate, yCoordinate) {

        var newCalculatedCells = []
        for(var i =0; i<cells.length; i++){
            modelView[cells[i]["index"]] = viewModel.updateItem(cells[i]["row"])
            newCalculatedCells.push( modelView[cells[i]["index"]])
        }

        for(var i=0; i<newCalculatedCells.length; i++){
            this.updateDataSourceSingleCell(newCalculatedCells[i])
        }


        var self = this

        grid.destructor()

        if(document.getElementById('specialForm')) {
            $('#specialForm').modal('hide');
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
        }

        grid =  webix.ui({
                    container: "pivotGrid",
                    view: "datatable",
                    navigation:true,
                    id: "grid",
                    editable:true,
                    leftSplit:1,
                    scheme: {
                        $change: function (item) {
                            self.createColourConfiguration(item);
                        }
                    },
                    columns: columns,
                    datatype: "jsarray",
                    data: dataSource
                });



       generalController.createListeners(grid);
    }

    GridDataView2.prototype.getDataSource = function(){
        return dataSource
    }

    GridDataView2.prototype.updateDataSourceSingleCell = function(newCell){
        var result = {}
        var found = false;
        for(var i =0; i< dataSource.length && !found; i++){
                if(dataSource[i][0] == newCell[0] ){
                    for( var j=0; j< arrDiffDates.length && !found; j++){
                        if(newCell[2] == arrDiffDates[j]){
                            found = true;
                            dataSource[i][j+1] = newCell[3]
                            result['row'] =  dataSource[i]
                            result['idRow'] = i;
                        }
                    }
                }
            }
        return result;
    }

    return GridDataView2;

})