/**
 * Created by fabrizio on 7/7/14.
 */
define(["jquery", "view/GridDataView", "editorController/FormController",
        "exporter/controller/ExportController", "adapterGrid", "formulasAmis/controller/FormulaController",
        "editingSpecial/controller/ControllerEditors", "generalObserver/GeneralObserver" , "editHandler", "jquery.sidebar"],
    function ($, GridDataView, EditorController, ExportController, Adapter, FormulaController, SpecialEditorController, GeneralObserver, EditHandler) {

        var ViewGrid, ModelController, FormController, dsd, Configurator, adapterGrid, formulaController, supportUtility,
            specialControlEditor, editingOnCell, generalObserver, filterData, xCoordinate, yCoordinate, grid, editHandler


        function GeneralController() {
            editHandler = new EditHandler;
            ViewGrid = new GridDataView;
            FormController = new EditorController;
            adapterGrid = new Adapter;
            formulaController = new FormulaController;
            specialControlEditor = new SpecialEditorController;
            generalObserver = new GeneralObserver;
            editingOnCell = true
        };

        GeneralController.prototype.init = function (gridModel, tableModel, configurator, modelController, utility, NProgress) {
            generalObserver.init(this)
            ModelController = modelController;
            dsd = configurator.getDSD();
            Configurator = configurator;
            supportUtility = utility;
            // create a copy
            var tableModelWithFormula = $.extend(true, [], tableModel);
            filterData = supportUtility.getFilterData()

            // formula
            formulaController.init(tableModelWithFormula, Configurator, filterData)

            // visualization model
            grid = ViewGrid.init(tableModelWithFormula, configurator, supportUtility, this)

            NProgress.done()

            this.onChangeModalityEditing();
        }

        GeneralController.prototype.createListeners = function (grid) {
            var self = this;
            console.log('GCONTROLLER : createListenersgrid')

            var resultedClicked
            grid.attachEvent("onItemClick", function (id, e, node) {
                this.blockEvent();
                xCoordinate = window.pageXOffset;
                yCoordinate = window.pageYOffset;

                // no clikc on the first column
                if (id.column != 'data0' && resultedClicked != -1) {
                    var cellTableModel2 = ModelController.getTableDataModel();
                    var cellTableModel = $.extend(true, {}, cellTableModel2);
                    // To identify when the first new nested row starts
                    var indexesObject = ModelController.getIndexesNewFirstColumnLeft();
                    resultedClicked = adapterGrid.getClickedCell(cellTableModel, Configurator, id, this, indexesObject);

                    var clickedCell = resultedClicked["clickedCell"]
                    var isEditable = formulaController.checkIfEditableCell(clickedCell)
                    editHandler.startEditCell(resultedClicked, isEditable, editingOnCell, grid, self)

                } else {
                    this.unblockEvent()
                }
            });

            var eventStop = grid.attachEvent("onBeforeEditStop", function (state, editor) {

                if (state.value == resultedClicked.clickedCell[3]) {
                    this.blockEvent()
                    state.value = state.old;
                    this.unblockEvent();
                } else {
                    if (state.value != null && state.value != '') {
                        var newValue = parseFloat(state.value)
                        resultedClicked.clickedCell[3] = newValue
                        var indTable = resultedClicked["indTable"];
                        var rowGridIndex = resultedClicked["rowGridIndex"];
                        var columnGridIndex = resultedClicked["columnGridIndex"];
                        self.updateGrid(resultedClicked.clickedCell, indTable, rowGridIndex, columnGridIndex)
                        resultedClicked = -1
                    } else {
                        this.blockEvent()
                        state.value = state.old;
                        this.unblockEvent();
                    }
                }
            });


            $("#export").click(function () {
                var ExportControl = new ExportController;
                var table = ModelController.getTableDataModel();
                ExportControl.init(table, Configurator)
            })


            $('#newForecast').on("click", function () {
                self.updateWithNewForecast()
            })
        }

        GeneralController.prototype.startSpecialEditing = function (resultedClicked) {
            console.log('GC: startSpecialEditing')
            if (resultedClicked.clickedCell[0] == 5 || resultedClicked.clickedCell[0] == 2 || resultedClicked.clickedCell[0] == 4) {
                var allData = $.extend(true, {}, ModelController.getData());
                var tableData = $.extend(true, {}, ModelController.getTableDataModel());
                specialControlEditor.init(allData, tableData, resultedClicked, formulaController, Configurator, supportUtility, this, filterData.productCode);
            } else {
                var allData = ModelController.getData();
                var tableData = $.extend(true, {}, ModelController.getTableDataModel());
                specialControlEditor.init(allData, tableData, resultedClicked, formulaController, Configurator, supportUtility, this, filterData.productCode);
            }// other form
        }

        GeneralController.prototype.startFullEditing = function (resultedClicked) {

            console.log('GC: startFullEditing')
            var clickedCell = resultedClicked["clickedCell"]
            var indTable = resultedClicked["indTable"];
            var rowGridIndex = resultedClicked["rowGridIndex"];
            var columnGridIndex = resultedClicked["columnGridIndex"];
            FormController.init(Configurator, clickedCell, dsd)
            this.onSaveButton(indTable, clickedCell, rowGridIndex, columnGridIndex);
        }

        GeneralController.prototype.onSaveButton = function (indTable, cell, rowIndex, columnIndex) {

            var that = this;
            $("#saveButton").on('click', function (e) {
                e.preventDefault()
                e.stopImmediatePropagation();
                var newCell = FormController.getValue(cell)
                if (newCell.length > 0) {
                    that.updateGrid(newCell, indTable, rowIndex, columnIndex)
                }
            });
        }

        GeneralController.prototype.updateGrid = function (newCell, indTable, rowIndex, columnIndex) {
            console.log('GC: updateGrid ')
            grid.blockEvent()
            var bindedKeys = formulaController.getBindedKeys();
            ModelController.updateModels(newCell, indTable, rowIndex, columnIndex)
            // check if need to apply a formula
            var codeNewCell = newCell[0]
            if (formulaController.checkIfBindedCode(bindedKeys, codeNewCell)) {

                var tableModel = ModelController.getTableDataModel();
                var modelWithFormulas = $.extend(true, [], tableModel);
                formulaController.init(modelWithFormulas, Configurator, filterData)

                var formulas = formulaController.getFormulasBindedFromKey(codeNewCell)
                // Initially, order by date
                formulaController.sortByDateAtStart(modelWithFormulas);

                var rowsChanged = formulaController.applyUpdateFormulas(modelWithFormulas, formulas, columnIndex, rowIndex);

                rowsChanged.push({'index': indTable, 'row': newCell})

                // at the end, order like initially
                formulaController.sortInitialValue(modelWithFormulas);
                ViewGrid.updateBatchGridView(modelWithFormulas, rowsChanged, xCoordinate, yCoordinate);
            } else {
                ViewGrid.updateGridView(newCell, indTable, xCoordinate, yCoordinate);
            }
        }

        GeneralController.prototype.saveDataFromProductionRiceForm = function (newCalculatedData, newOriginalData, cellClickedInfo) {

            console.log('GC: saveDataFromProductionRiceForm')
            var indexes = ModelController.saveDataFromRiceProduction(newOriginalData, cellClickedInfo.indTable, cellClickedInfo.rowGridIndex, cellClickedInfo.columnGridIndex)
            var tableModel = ModelController.getTableDataModel();

            var modelWithFormulas = $.extend(true, [], tableModel);

            formulaController.init(modelWithFormulas, Configurator, filterData)
            var rowsChanged = []
            for (var i = 0; i < newCalculatedData.length; i++) {
                for (var j = 0; j < indexes.length; j++) {
                    if (newCalculatedData[i][0] == indexes[j]['key']) {
                        rowsChanged.push({'index': indexes[j]['index'], 'row': newCalculatedData[i]})
                    }
                }
            }
            console.log('generalController: saveDataFromProductionForm, before updateBatchGridView')
            ViewGrid.updateBatchGridView(modelWithFormulas, rowsChanged, xCoordinate, yCoordinate);

        }

        GeneralController.prototype.saveDataFromProductionForm = function (newCalculatedData, newOriginalData, cellClickedInfo) {
            console.log('generalController: saveDataFromProductionForm, init')
            var indexes = ModelController.saveDataFromProduction(newOriginalData, cellClickedInfo.indTable, cellClickedInfo.rowGridIndex, cellClickedInfo.columnGridIndex)
            var tableModel = ModelController.getTableDataModel();

            var modelWithFormulas = $.extend(true, [], tableModel);

            formulaController.init(modelWithFormulas, Configurator, filterData)
            var rowsChanged = []
            for (var i = 0; i < newCalculatedData.length; i++) {
                for (var j = 0; j < indexes.length; j++) {
                    if (newCalculatedData[i][0] == indexes[j]['key']) {
                        rowsChanged.push({'index': indexes[j]['index'], 'row': newCalculatedData[i]})
                    }
                }
            }
            ViewGrid.updateBatchGridView(modelWithFormulas, rowsChanged, xCoordinate, yCoordinate);
        }

        GeneralController.prototype.updateWithNewForecast = function () {
            console.log('GC: updateWithNewForecast')
            var tableModel = ModelController.createNewForecast();
            var tableModelWithFormula = $.extend(true, [], tableModel);
            formulaController.init(tableModelWithFormula, Configurator, filterData)
            var grid = ViewGrid.init(tableModelWithFormula, Configurator, supportUtility)
            this.createListeners(grid)
            this.onChangeModalityEditing()
        }

        GeneralController.prototype.onChangeModalityEditing = function () {
            $("#editingChoice").bind('change', function (event) {
                event.preventDefault()
                editingOnCell = !event.args.checked;
                editHandler.updateEditingOnCell(editingOnCell)
            })
        }

        return GeneralController;

    });