class GasStateByMach {
    constructor() {
        this.kappa = 1.4; // kappa = 1.4 for normal air
        this.mach = 1.0;
    }

    setKappa(kappa) {
        this.kappa = +kappa;
    }

    getKappa() {
        return this.kappa;
    }

    setArgument(mach) {
        this.mach = +mach;
    }

    getMach() {
        return this.mach;
    }

    getQu() {
        return Math.pow((this.kappa + 1.0) / 2.0, 1.0 / (this.kappa - 1.0)) * this.getLambda() * Math.pow(1.0 - (this.kappa - 1.0) / (this.kappa + 1.0) * Math.pow(this.getLambda(), 2.0), 1.0 / (this.kappa - 1.0));
    }

    getLambda() {
        //        return Math.sqrt(Math.pow(this.getMach(),2.)*(this.kappa+1.)/2./(1.+(this.kappa-1.)/2.*Math.pow(this.getMach(),2.)));
        return Math.sqrt(Math.pow(this.getMach(), 2) * (this.kappa + 1) / 2 / (1 + (this.kappa - 1) / 2 * Math.pow(this.getMach(), 2)));
    }

    getPi() {
        return 1.0 / this.getPiInverse();
    }

    getPiInverse() {
        return Math.pow(this.getTauInverse(), this.kappa / (this.kappa - 1.0));
    }

    getEpsilon() {
        return 1.0 / this.getRoInverse();
    }

    getRoInverse() {
        return Math.pow(this.getTauInverse(), 1.0 / (this.kappa - 1.0));
    }

    getTau() {
        return 1.0 / this.getTauInverse();
    }

    getTauInverse() {
        return 1.0 + (this.kappa - 1.0) / 2.0 * Math.pow(this.getMach(), 2.0);
    }
}

class GasStateByLambda {

    constructor() {
        this.kappa = 1.4; // kappa = 1.4 for normal air
        this.lambda = 1.0;
    }

    setKappa(kappa) {
        this.kappa = +kappa;
    }

    getKappa() {
        return this.kappa;
    }

    setArgument(lambda) {
        this.lambda = +lambda;
    }

    getLambda() {
        return this.lambda;
    }

    getMach() {
        return Math.sqrt(2.0 * Math.pow(this.getLambda(), 2.0) / (this.kappa + 1.0 - Math.pow(this.getLambda(), 2.0) * (this.kappa - 1.0)));
    }

    getPi() {
        return Math.pow(this.getEpsilon(), this.kappa);
    }

    getEpsilon() {
        return Math.pow(this.getTau(), 1.0 / (this.kappa - 1.0));
    }

    getTau() {
        return 1.0 - (this.kappa - 1.0) / (this.kappa + 1.0) * Math.pow(this.getLambda(), 2.0);
    }

    getQu() {
        return this.getLambda() * this.getEpsilon() * Math.pow((this.kappa + 1.0) / 2.0, 1.0 / (this.kappa - 1.0));
    }

    getLambdaMax() {
        return Math.sqrt((this.kappa + 1.0) / (this.kappa - 1.0));
    }
}

function getArgByHalfMethod(fun, trgtFunVal, xLimLeft, xLimRight, accuracy) {
    let acc = accuracy !== undefined ? accuracy : 1e-9;
    let yLeft = fun(xLimLeft),
        yRight = fun(xLimRight);
    if (Math.abs(trgtFunVal - yLeft) < acc) {
        return xLimLeft;
    }
    if (Math.abs(trgtFunVal - yRight) < acc) {
        return xLimRight;
    }
    let xLeft = xLimLeft,
        xRight = xLimRight,
        x, y;
    while (Math.abs(xRight - xLeft) > acc) {
        x = (xLeft + xRight) * 0.5;
        y = fun(x);
        if ((y - trgtFunVal) * (yRight - trgtFunVal) < 0) {
            xLeft = x;
            continue;
        }
        //        if ((yLeft - trgtFunVal)*(y - trgtFunVal) < 0) {} - TODO if not, throw Exception
        xRight = x;
    }
    return (xLeft + xRight) * 0.5;
}

class GasStateDelegate {
    constructor(wrappedState) {
        this.wrappedState = wrappedState;
    }
    setKappa(kappa) {
        this.wrappedState.setKappa(kappa);
    }
    getKappa() {
        return this.wrappedState.getKappa();
    }
    getMach() {
        return this.wrappedState.getMach();
    }
    getLambda() {
        return this.wrappedState.getLambda();
    }
    getPi() {
        return this.wrappedState.getPi();
    }
    getEpsilon() {
        return this.wrappedState.getEpsilon();
    }
    getTau() {
        return this.wrappedState.getTau();
    }
    getQu() {
        return this.wrappedState.getQu();
    }
}

class GasStateByQu extends GasStateDelegate {
    constructor() {
        super(new GasStateByLambda());
        this.qu = this.getQu();
        this.funQuByLambda = function (lambda) {
            this.setArgument(lambda);
            return this.getQu();
        };
        this.funQuByLambda = this.funQuByLambda.bind(this.wrappedState);
        this.setSubsound();
    }

    setSubsound() {
        this.leftLyambda = 0.0;
        this.rightLyambda = 1.0;
    }

    setSupersound() {
        this.leftLyambda = 1.0;
        this.rightLyambda = this.wrappedState.getLambdaMax();
    }

    setArgument(qu) {
        this.qu = +qu;
        this.wrappedState.setArgument(
            getArgByHalfMethod(this.funQuByLambda, this.qu, this.leftLyambda, this.rightLyambda)
        );
    }

    getQu() {
        return this.qu;
    }
}

class GasStateByPi extends GasStateDelegate {
    constructor() {
        super(new GasStateByMach());
    }

    setArgument(pi) {
        this.pi = +pi;
        this.wrappedState.setArgument(
            Math.sqrt((Math.pow(1.0 / this.pi, (this.getKappa() - 1.0) / this.getKappa()) - 1.0) * 2.0 / (this.getKappa() - 1.0))
        );
    }

    getPi() {
        return this.pi;
    }
}

class GasStateByTau extends GasStateDelegate {
    constructor() {
        super(new GasStateByMach());
    }

    setArgument(tau) {
        this.tau = +tau;
        this.wrappedState.setArgument(
            Math.sqrt((1.0 / this.tau - 1.0) * 2.0 / (this.getKappa() - 1.0))
        );
    }

    getTau() {
        return this.tau;
    }

}

class GasStateByEpsilon extends GasStateDelegate {
    constructor() {
        super(new GasStateByMach());
    }

    setArgument(epsilon) {
        this.epsilon = +epsilon;
        this.wrappedState.setArgument(
            Math.sqrt((Math.pow(1.0 / this.epsilon, this.getKappa() - 1.0) - 1.0) * 2.0 / (this.getKappa() - 1.0))
        );
    }

    getEpsilon() {
        return this.epsilon;
    }
}

class ControllerInput {
    constructor(input) {
        this.input = input;
        this.name = input.name;
        this.listenersInput = [];
        this.listenersUpdate = [];
        this.initEvents();
    }

    initEvents() {
        let signalInput = this.signalInput.bind(this);
        this.input.addEventListener('input', signalInput);
    }

    signalInput() {
        //        listener is method 
        for (let listener of this.listenersInput) {
            listener(this.name, this.input.value);
        }
    }

    addListenerInput(listener) {
        //        listener is method 
        this.listenersInput.push(listener);
    }

    setValue(value) {
        this.input.value = value;
        this.signalUpdate();
    }

    signalUpdate() {
        //        listener is method
        for (let listener of this.listenersUpdate) {
            listener(this.name, this.input.value);
        }
    }

    addListenerUpdate(listener) {
        //        listener is method 
        this.listenersUpdate.push(listener);
    }

}

let getterByName = {
    'kappa': 'getKappa',
    'mach': 'getMach',
    'lambda': 'getLambda',
    'pi': 'getPi',
    'tau': 'getTau',
    'epsilon': 'getEpsilon',
    'qu': 'getQu'
};

class ControllerGasState {
    constructor(inputController, gasState) {
        this.inputController = inputController;
        this.argGetterName = getterByName[inputController.name];
        this.gasState = gasState;
        this.dependentControllers = [];
        this.initEvents();
    }

    initEvents() {
        let onCurrArgInput = this.onCurrArgInput.bind(this);
        this.inputController.addListenerInput(onCurrArgInput);
    }

    onCurrArgInput(name, value) {
        this.gasState.setArgument(value);
        this.updateDependentControllers();
    }

    setDependentControllers(dependentControllers) {
        let thisController = this;
        this.dependentControllers = dependentControllers.filter(function (item) {
            return item !== thisController;
        });
    }

    updateValueBy(currGasState) {
        let newVal = currGasState[this.argGetterName]();
        this.inputController.setValue(newVal);
    }

    updateDependentControllers() {
        for (let dependent of this.dependentControllers) {
            dependent.updateValueBy(this.gasState);
        }
    }

    bindKappaController(kappaInputController) {
        let onKappaChangedSetKappaVal = this.onKappaChangedSetKappaVal.bind(this);
        kappaInputController.addListenerInput(onKappaChangedSetKappaVal);
    }

    onKappaChangedSetKappaVal(name, kappaValue) {
        this.gasState.setKappa(kappaValue);
    }

    addListenerInput(listener) {
        this.inputController.addListenerInput(listener);
    }

    addListenerUpdate(listener) {
        this.inputController.addListenerUpdate(listener);
    }

    setCurrValueToGasState() {
        let currVal = this.inputController.input.value;
        this.gasState.setArgument(currVal);
    }
}

class KappaController {
    constructor(kappaInputController, nameVsGasStateController) {
        this.kappaInputController = kappaInputController;
        this.nameVsGasStateController = nameVsGasStateController;
        this.activeName = 'mach';
        this.initListeners();
    }

    initListeners() {
        let onGasFunctionInputSetActive = this.onGasFunctionInputSetActive.bind(this);
        for (let name in this.nameVsGasStateController) {
            let controller = this.nameVsGasStateController[name];
            controller.bindKappaController(this.kappaInputController);
            controller.addListenerInput(onGasFunctionInputSetActive);
        }
        let onKappaChangedUpdateFields = this.onKappaChangedUpdateFields.bind(this);
        this.kappaInputController.addListenerInput(onKappaChangedUpdateFields);
    }

    onKappaChangedUpdateFields(name, value) {
        let activeController = this.nameVsGasStateController[this.activeName];
        activeController.updateDependentControllers();
    }

    onGasFunctionInputSetActive(name, value) {
        this.activeName = name;
    }

    onMachZoneSwitcherClickedSetQuActive() {
        // set as listener in ControllerMachZoneSwitcher
        this.activeName = 'qu';
    }
}

function splitElementsBy(elementFieldName, elements) {
    //    let elementsByClassNames = new Map();
    let elementsByClassNames = {};
    for (let element of elements) {
        //        elementsByClassNames.set(item.name, item);
        elementsByClassNames[element[elementFieldName]] = element;
    }
    return elementsByClassNames;
}

class ControllerMachZoneSwitcher {
    constructor(machInputController, kappaController, quController) {
        this.machInputController = machInputController;
        this.kappaController = kappaController;
        this.quController = quController;
        let flowSpeedElements = document.getElementsByName('flow_speed');
        this.radios = splitElementsBy('id', flowSpeedElements);
        this.initEvents();
    }

    initEvents() {
        let updateSwitcherState = this.updateSwitcherStateByMachVal.bind(this);
        this.machInputController.addListenerInput(updateSwitcherState);
        this.machInputController.addListenerUpdate(updateSwitcherState);
        
        let subsoundChecked = this.subsoundChecked.bind(this);
        this.radios['subsound'].addEventListener('change', subsoundChecked);
        let supersoundChecked = this.supersoundChecked.bind(this);
        this.radios['supersound'].addEventListener('change', supersoundChecked);
        
        let onMachZoneSwitcherClickedSetQuActive = this.kappaController.onMachZoneSwitcherClickedSetQuActive.bind(this.kappaController);
        let setQuValToGasState = this.setQuValToGasState.bind(this);
        let updateFieldsByQuController = this.updateFieldsByQuController.bind(this);
        
        for (let id in this.radios) {
            let radio = this.radios[id];
            radio.addEventListener('change', onMachZoneSwitcherClickedSetQuActive);
            radio.addEventListener('change', setQuValToGasState);
            radio.addEventListener('change', updateFieldsByQuController);
        }
    }

    updateSwitcherStateByMachVal(name, value) {
        let val = +value;
        if (val < 1) {
            this.radios['subsound'].checked = true;
            this.quController.gasState.setSubsound();
            return;
        }
        if (val > 1) {
            this.radios['supersound'].checked = true;
            this.quController.gasState.setSupersound();
            return;
        }
        // default state
        if ( !this.radios['subsound'].checked && !this.radios['supersound'].checked) {
            this.radios['subsound'].checked = true;
            this.quController.gasState.setSubsound();
            return;
        }
    }
    
    subsoundChecked() {
        this.quController.gasState.setSubsound();
    }
    
    supersoundChecked() {
        this.quController.gasState.setSupersound();
    }

    setQuValToGasState() {
        this.quController.setCurrValueToGasState();
    }
    
    updateFieldsByQuController() {
        this.quController.updateDependentControllers();
    }
}

class Controller2 {
    constructor() {
        this.nameVsGasState = {
            'mach': new GasStateByMach(),
            'lambda': new GasStateByLambda(),
            'pi': new GasStateByPi(),
            'tau': new GasStateByTau(),
            'epsilon': new GasStateByEpsilon(),
            'qu': new GasStateByQu()
        };
        this.initInputControllers();
        this.initGasStateControllers();
        this.initDependencies();
        this.printDefaults();

    }

    initInputControllers() {
        let inputs = document.getElementsByClassName("gdf_input");
        let inputControllers = Array.from(inputs, function (input) {
            return new ControllerInput(input);
        });
        this.nameVsInputController = splitElementsBy('name', inputControllers);
    }

    initGasStateControllers() {
        this.nameVsGasStateController = {};
        this.gasStateControllers = [];
        for (let name in this.nameVsGasState) {
            let gasState = this.nameVsGasState[name];
            let inputController = this.nameVsInputController[name];
            let gasStateController = new ControllerGasState(inputController, gasState);
            this.nameVsGasStateController[name] = gasStateController;
            this.gasStateControllers.push(gasStateController);
        }
    }

    initDependencies() {
        this.gasStateControllers.forEach(function (controller, i, controllers) {
            controller.setDependentControllers(controllers);
        });
        this.kappaController = new KappaController(
            this.nameVsInputController['kappa'], this.nameVsGasStateController
        );
        this.machZoneSwitcher = new ControllerMachZoneSwitcher(
            this.nameVsInputController['mach'], this.kappaController, this.nameVsGasStateController['qu']
        );
    }

    printDefaults() {
        let defaultActiveName = this.kappaController.activeName;
        let defaultActiveState = this.nameVsGasState[defaultActiveName];
        let defaultActiveController = this.nameVsGasStateController[defaultActiveName];
        let kappaInput = this.nameVsInputController['kappa'];
        kappaInput.setValue(defaultActiveState.getKappa());
        this.kappaController.onKappaChangedUpdateFields();
        defaultActiveController.updateValueBy(defaultActiveState);
    }

}

class FieldController {
    // TODO 200519 introduce FieldController for Kappa and Qu
    constructor(name, input, gasState, argGetterName) {
        this.name = name;
        this.input = input;
        this.gasState = gasState;
        this.argGetterName = argGetterName;
        this.updatableControllers = [];
        this.initEvents();
        this.active = false;
    }

    addUpdatableController(updatableController) {
        if (updatableController === this) {
            return;
        }
        this.updatableControllers.push(updatableController);
    }

    initEvents() {
        this.initEventFocus();
        this.initEventInput();
    }

    initEventInput() {
        let handlerSetCurrArg = this.handlerSetCurrArg.bind(this);
        let handlerUpdateFields = this.handlerUpdateFields.bind(this);

        this.input.addEventListener('input', handlerSetCurrArg);
        this.input.addEventListener('input', handlerUpdateFields);
    }

    handlerSetActive() {
        this.active = true;
        for (let updatableController of this.updatableControllers) {
            updatableController.setInactive();
        }
    }

    setInactive() {
        this.active = false;
    }

    handlerSetCurrArg() {
        this.gasState.setArgument(this.input.value);
    }

    handlerUpdateFields() {
        for (let updatableController of this.updatableControllers) {
            updatableController.updateValueBy(this.gasState);
        }
    }

    updateValueBy(currGasState) {
        this.input.value = currGasState[this.argGetterName]();
    }
}

class KappaController0 {
    controller(input) {
        this.input = input;
        this.fieldControllers = [];
        this.initEvents();
    }

    initEvents() {
        this.initEventInput();
    }

    initEventInput() {
        let handlerSetCurrArg = this.handlerSetCurrArg.bind(this);
        this.input.addEventListener('input', handlerSetCurrArg);
    }

    pushFieldController(fieldController) {
        this.fieldControllers.push(fieldController);
    }

    handlerSetCurrArg() {
        let kappa = this.input.value;
        for (let fieldController of this.fieldControllers) {
            fieldController.setKappa(kappa);
        }
    }
}

class Controller {
    constructor() {
        this.gasStateByName = {
            'mach': new GasStateByMach(),
            'lambda': new GasStateByLambda(),
            'pi': new GasStateByPi(),
            'tau': new GasStateByTau(),
            'epsilon': new GasStateByEpsilon(),
            'qu': new GasStateByQu()
        };
        this.getterByName = {
            'kappa': 'getKappa',
            'mach': 'getMach',
            'lambda': 'getLambda',
            'pi': 'getPi',
            'tau': 'getTau',
            'epsilon': 'getEpsilon',
            'qu': 'getQu'
        };
        this.initInputs();
        this.initInitialState();
        this.initEvents();
    }



    initInputs() {
        let gdfInputs = document.getElementsByClassName("gdf_input");
        this.inputsByNames = this.splitElementsByName(gdfInputs);
        this.inputsByNamesForUpdation = Object.assign({}, this.inputsByNames);
    }

    initInitialState() {
        this.currGasStateName = 'mach';
        this.currInputName = 'mach';
        this.currGasState = this.gasStateByName[this.currGasStateName];
        this.handlerUpdateFields();
        // prevent on air field updation
        delete this.inputsByNamesForUpdation[this.currGasStateName];
    }

    splitElementsByName(elements) {
        //    let elementsByClassNames = new Map();
        let elementsByClassNames = {};
        for (let item of elements) {
            //        elementsByClassNames.set(item.name, item);
            elementsByClassNames[item.name] = item;
        }
        return elementsByClassNames;
    }

    initEvents() {
        this.initEventFocus();
        this.initEventInput();
    }

    initEventFocus() {
        let handlerDontUpdateChangeSrc = this.handlerDontUpdateChangeSrc.bind(this);
        for (let name in this.inputsByNames) {
            this.inputsByNames[name].addEventListener('focus', handlerDontUpdateChangeSrc);
        }
        let handlerSetCurrGasState = this.handlerSetCurrGasState.bind(this);
        for (let name in this.inputsByNames) {
            if (name == 'kappa') {
                continue;
            }
            this.inputsByNames[name].addEventListener('focus', handlerSetCurrGasState);
        }
    }

    initEventInput() {
        let handlerSetKappa = this.handlerSetKappa.bind(this);
        this.inputsByNames['kappa'].addEventListener('input', handlerSetKappa);

        let handlerSetCurrArg = this.handlerSetCurrArg.bind(this);
        for (let name in this.inputsByNames) {
            if (name == 'kappa') {
                continue;
            }
            this.inputsByNames[name].addEventListener('input', handlerSetCurrArg);
        }

        let handlerUpdateFields = this.handlerUpdateFields.bind(this);
        for (let name in this.inputsByNames) {
            this.inputsByNames[name].addEventListener('input', handlerUpdateFields);
        }
    }

    handlerDontUpdateChangeSrc(e) {
        this.inputsByNamesForUpdation[this.currInputName] = this.inputsByNames[this.currInputName];
        this.currInputName = e.target.name;
        delete this.inputsByNamesForUpdation[this.currInputName];
    }

    handlerSetCurrGasState(e) {
        this.currGasStateName = e.target.name;
        this.currGasState = this.gasStateByName[this.currGasStateName];
    }

    handlerSetKappa() {
        let name;
        for (name in this.gasStateByName) {
            this.gasStateByName[name].setKappa(this.inputsByNames['kappa'].value);
        }
    }

    handlerSetCurrArg(e) {
        this.currGasState.setArgument(e.target.value);
    }

    handlerUpdateFields() {
        let name;
        for (name in this.inputsByNamesForUpdation) {
            this.inputsByNamesForUpdation[name].value = this.currGasState[this.getterByName[name]]();
        }

    }

    handlerSetFlowType(e) {
        if (e.target.name == 'supersound') {
            this.gasStateByName['qu'].setSupersound();
            return;
        }
        this.gasStateByName['qu'].setSubsound();
    }

}

/*
    TODO 200519
        1. define pi, tau, epsilon using lambda
        2. limit pi, tau, epsilon in range 0...1
        3. limit lambda with lambda_max
        4. correct labels of M<1 M>1: 
            4.1 bind labels to Qu value
            4.2 bind other fields to labels state changing
        5. format control
            5.1 only one floating point
            5.2 comma to dot correction
            5.3 number of digit positions after dot
            5.4 scientific representation
        6. page must scale up for mobile devices correctly
        7. tooltips
        8. graphs
*/

let controller = new Controller2();
