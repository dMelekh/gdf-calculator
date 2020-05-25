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


function splitElementsBy(elementFieldName, elements) {
    //    let elementsByClassNames = new Map();
    let fieldValueVsElement = new Map();
    for (let element of elements) {
        //        elementsByClassNames.set(item.name, item);
        fieldValueVsElement.set(element[elementFieldName], element);
    }
    return fieldValueVsElement;
}

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

    getArgMin() {
        return 0.0;
    }

    getArgMax() {
        return Infinity;
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

    getArgMin() {
        return 0.0;
    }

    getArgMax() {
        return this.getLambdaMax();
    }

    getLambdaMax() {
        return Math.sqrt((this.kappa + 1.0) / (this.kappa - 1.0));
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

    getArgMin() {
        return 0.0;
    }

    getArgMax() {
        return 1.0;
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
        //        super(new GasStateByMach());
        super(new GasStateByLambda());
    }

    setArgument(pi) {
        this.pi = +pi;
        this.wrappedState.setArgument(
            //            this._getMach(this.getKappa(), this.pi)
            this._getLambda(this.getKappa(), this.pi)
        );
    }

    _getMach(k, pi) {
        return Math.sqrt((Math.pow(1.0 / pi, (k - 1.0) / k) - 1.0) * 2.0 / (k - 1.0));
    }

    _getLambda(k, pi) {
        return Math.sqrt((1 - Math.pow(pi, (k - 1.0) / k)) * (k + 1.0) / (k - 1.0));
    }

    getPi() {
        return this.pi;
    }
}

class GasStateByTau extends GasStateDelegate {
    constructor() {
        //        super(new GasStateByMach());
        super(new GasStateByLambda());
    }

    setArgument(tau) {
        this.tau = +tau;
        this.wrappedState.setArgument(
            //            this._getMach(this.getKappa(), this.tau)
            this._getLambda(this.getKappa(), this.tau)
        );
    }

    _getMach(k, tau) {
        return Math.sqrt((1.0 / tau - 1.0) * 2.0 / (k - 1.0));
    }

    _getLambda(k, tau) {
        return Math.sqrt((1.0 - tau) * (k + 1.0) / (k - 1.0));
    }

    getTau() {
        return this.tau;
    }

}

class GasStateByEpsilon extends GasStateDelegate {
    constructor() {
        //        super(new GasStateByMach());
        super(new GasStateByLambda());
    }

    setArgument(epsilon) {
        this.epsilon = +epsilon;
        this.wrappedState.setArgument(
            this._getLambda(this.getKappa(), this.epsilon)
        );
    }

    _getMach(k, epsilon) {
        return Math.sqrt((Math.pow(1.0 / this.epsilon, k - 1.0) - 1.0) * 2.0 / (k - 1.0));
    }

    _getLambda(k, epsilon) {
        return Math.sqrt((1.0 - Math.pow(epsilon, k - 1.0)) * (k + 1.0) / (k - 1.0));
    }

    getEpsilon() {
        return this.epsilon;
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

class ControllerFormProperties {
    constructor() {
        let inputs = document.getElementsByClassName("setting_input");
        this.nameVsInput = splitElementsBy('name', inputs);
    }
    
    formatValue(value) {
        let mantissaSize = +this.nameVsInput.get('mantissa_size').value;
        let notation = this.nameVsInput.get('notation').value;
        let formattedValue;
        if (notation == 'scientific') {
            formattedValue = (+value).toExponential(mantissaSize);
        } else {
//            let intPartSize = Math.trunc(Math.log10(+value)) + 1;
            formattedValue = +value.toFixed(mantissaSize);
        }
        formattedValue = this.replaceSeparator(formattedValue);
        return formattedValue;
    }
    
    replaceSeparator(value) {
        let separator = this.nameVsInput.get('decimal_separator').value;
        return value.toString().replace(/[\.\,]/g, separator);
    }
    
    addListenerFormatChanged(listener) {
        for (let input of this.nameVsInput.values()) {
            input.addEventListener('change', listener);
        }
    }
}

class ControllerInput {
    constructor(input, properties) {
        this.input = input;
        this.properties = properties;
        this.name = input.name;
        this.listenersInput = [];
        this.listenersUpdate = [];
        this.pattern = new RegExp(input['pattern']);
        this.prevValue = '';
        this.initEvents();
    }

    initEvents() {
        let signalInput = this.signalInput.bind(this);
        this.input.addEventListener('input', signalInput);
        let updateSeparatorOnOutput = this.updateSeparatorOnOutput.bind(this);
        this.properties.addListenerFormatChanged(updateSeparatorOnOutput);
    }

    signalInput() {
        //        listener is method 
        if (this.checkFormat()) {
            this.updateSeparatorOnOutput();
            let inputtedValue = this.getValue();
            for (let listener of this.listenersInput) {
                listener(this.name, inputtedValue);
            }
        }
    }

    checkFormat() {
//        console.log(this.input.value, this.prevValue, this.pattern.test(this.input.value) );
        if (this.pattern.test(this.input.value)) {
            this.prevValue = this.input.value;
            return true;
        }
        this.input.value = this.prevValue;
        return false;
    }
    
    updateSeparatorOnOutput() {
        this.input.value = this.properties.replaceSeparator(this.input.value);
    }
    
    getValue() {
        return this.input.value.replace(/[\.\,]/g, '\.');
    }

    addListenerInput(listener) {
        //        listener is method 
        this.listenersInput.push(listener);
    }

    setFormattedValueToOutput(formattedValue) {
        this.prevValue = formattedValue;
        this.input.value = formattedValue;
        this.signalUpdate();
    }

    signalUpdate() {
        //        listener is method
        for (let listener of this.listenersUpdate) {
            listener(this.name, this.value);
        }
    }

    addListenerUpdate(listener) {
        //        listener is method 
        this.listenersUpdate.push(listener);
    }
}

class ControllerGasState {
    constructor(properties, inputController, gasState) {
        this.inputController = inputController;
        this.argGetterName = getterByName[inputController.name];
        this.gasState = gasState;
        this.properties = properties;
        this.dependentControllers = [];
        this.initEvents();
    }

    initEvents() {
        let onCurrArgInput = this.onCurrArgInput.bind(this);
        this.inputController.addListenerInput(onCurrArgInput);
    }

    onCurrArgInput(name, value) {
        let val = +value;
        if (val < this.gasState.getArgMin()) {
            val = this.gasState.getArgMin();
            this.setValueToOutput(val);
        }
        if (val > this.gasState.getArgMax()) {
            val = this.gasState.getArgMax();
            this.setValueToOutput(val);
        }
        this.gasState.setArgument(val);
        this.updateDependentControllers();
    }

    setDependentControllers(dependentControllers) {
        let thisController = this;
        this.dependentControllers = dependentControllers.filter(function (item) {
            return item !== thisController;
        });
    }

    updateDependentControllers() {
        for (let dependent of this.dependentControllers) {
            dependent.updateValueBy(this.gasState);
        }
    }

    updateValueBy(currGasState) {
        let newVal = currGasState[this.argGetterName]();
        this.setValueToOutput(newVal);
    }
    
    setValueToOutput(val) {
//        kappa does not use formatted output
//          - so ControllerFormProperties usage depends on ControllerGasState implementation
//            (heigher level than ControllerInput, not every ControllerInput uses it)
//        but ControllerInput uses decimal separator - so it also has ControllerFormProperties ref
//          and update of decimal separator on properties change is also part of ControllerInput
        let formatted = this.properties.formatValue(val);
        this.inputController.setFormattedValueToOutput(formatted);
    }

    bindActiveStateController(kappaInputController) {
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
        let currVal = this.inputController.getValue();
        this.gasState.setArgument(currVal);
    }
}

class ControllerActiveState {
    constructor(kappaInputController, nameVsGasStateController, properties) {
        this.kappaInputController = kappaInputController;
        this.nameVsGasStateController = nameVsGasStateController;
        this.properties = properties;
        this.activeName = 'mach';
        this.initListeners();
    }

    initListeners() {
        let onGasFunctionInputSetActive = this.onGasFunctionInputSetActive.bind(this);
        for (let controller of this.nameVsGasStateController.values()) {
            controller.bindActiveStateController(this.kappaInputController);
            controller.addListenerInput(onGasFunctionInputSetActive);
        }
        let onKappaChangedUpdateFields = this.onKappaChangedUpdateFields.bind(this);
        this.kappaInputController.addListenerInput(onKappaChangedUpdateFields);
        let onPropertiesChanged = this.onPropertiesChanged.bind(this);
        this.properties.addListenerFormatChanged(onPropertiesChanged);
    }

    onKappaChangedUpdateFields(name, value) {
        this.activeController().setCurrValueToGasState();
        this.updateActiveDependent();
    }
    
    onPropertiesChanged() {
        this.updateActiveDependent();
    }
    
    updateActiveDependent() {
        this.activeController().updateDependentControllers();
    }
    
    activeController() {
        return this.nameVsGasStateController.get(this.activeName);
    }

    onGasFunctionInputSetActive(name, value) {
        this.activeName = name;
    }

    onMachZoneSwitcherClickedSetQuActive() {
        // set as listener in ControllerMachZoneSwitcher
        this.activeName = 'qu';
    }
}


class ControllerMachZoneSwitcher {
    constructor(machInputController, activeStateController, quController) {
        this.machInputController = machInputController;
        this.activeStateController = activeStateController;
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
        this.radios.get('subsound').addEventListener('change', subsoundChecked);
        let supersoundChecked = this.supersoundChecked.bind(this);
        this.radios.get('supersound').addEventListener('change', supersoundChecked);

        let onMachZoneSwitcherClickedSetQuActive = this.activeStateController.onMachZoneSwitcherClickedSetQuActive.bind(this.activeStateController);
        let setQuValToGasState = this.setQuValToGasState.bind(this);
        let updateFieldsByQuController = this.updateFieldsByQuController.bind(this);

        for (let radio of this.radios.values()) {
            radio.addEventListener('change', onMachZoneSwitcherClickedSetQuActive);
            radio.addEventListener('change', setQuValToGasState);
            radio.addEventListener('change', updateFieldsByQuController);
        }
    }

    updateSwitcherStateByMachVal(name, value) {
        let val = +value;
        if (val < 1) {
            this.radios.get('subsound').checked = true;
            this.quController.gasState.setSubsound();
            return;
        }
        if (val > 1) {
            this.radios.get('supersound').checked = true;
            this.quController.gasState.setSupersound();
            return;
        }
        // default state
        if (!this.radios.get('subsound').checked && !this.radios.get('supersound').checked) {
            this.radios.get('subsound').checked = true;
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

class ControllerFormGdf {
    constructor() {
        this.nameVsGasState = new Map([
            ['mach', new GasStateByMach()],
            ['lambda', new GasStateByLambda()],
            ['pi', new GasStateByPi()],
            ['tau', new GasStateByTau()],
            ['epsilon', new GasStateByEpsilon()],
            ['qu', new GasStateByQu()]
        ]);
        this.properties = new ControllerFormProperties();
        this.initInputControllers();
        this.initGasStateControllers();
        this.initDependencies();
        this.printDefaults();
    }

    initInputControllers() {
        let inputs = document.getElementsByClassName("gdf_input");
        let properties = this.properties;
        let inputControllers = Array.from(inputs, function (input) {
            return new ControllerInput(input, properties);
        });
        this.nameVsInputController = splitElementsBy('name', inputControllers);
    }

    initGasStateControllers() {
        this.nameVsGasStateController = new Map();
        this.gasStateControllers = [];
        for (let name of this.nameVsGasState.keys()) {
            let gasState = this.nameVsGasState.get(name);
            let inputController = this.nameVsInputController.get(name);
            let gasStateController = new ControllerGasState(this.properties, inputController, gasState);
            this.nameVsGasStateController.set(name, gasStateController);
            this.gasStateControllers.push(gasStateController);
        }
    }

    initDependencies() {
        this.gasStateControllers.forEach(function (controller, i, controllers) {
            controller.setDependentControllers(controllers);
        });
        this.activeStateController = new ControllerActiveState(
            this.nameVsInputController.get('kappa'), this.nameVsGasStateController, this.properties
        );
        this.machZoneSwitcher = new ControllerMachZoneSwitcher(
            this.nameVsInputController.get('mach'), this.activeStateController, this.nameVsGasStateController.get('qu')
        );
    }

    printDefaults() {
        let defaultActiveName = this.activeStateController.activeName;
        let defaultActiveState = this.nameVsGasState.get(defaultActiveName);
        let defaultActiveController = this.nameVsGasStateController.get(defaultActiveName);
        let kappaInput = this.nameVsInputController.get('kappa');
        kappaInput.setFormattedValueToOutput(defaultActiveState.getKappa());
        this.activeStateController.updateActiveDependent();
        defaultActiveController.updateValueBy(defaultActiveState);
    }

}

/*
    TODO 200525
        1. format control
            1.3 number of digit positions after dot
            1.4 scientific representation
        2. tooltips
        3. graphs
*/

let controller = new ControllerFormGdf();
