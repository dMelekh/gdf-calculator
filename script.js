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
        this.leftLyambda = 0.0;
        this.rightLyambda = 1.0;
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
        this.currGasState = this.gasStateByName['mach'];
        this.initInputs();
        this.initEvents();
        this.handlerUpdateFields();
    }

    initInputs() {
        let gdfInputs = document.getElementsByClassName("gdf_input");
        this.inputsByNames = this.splitElementsByName(gdfInputs);
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
        let handlerSetCurrGasState = this.handlerSetCurrGasState.bind(this);
        let handlerUpdateFields = this.handlerUpdateFields.bind(this);
        let handlerSetKappa = this.handlerSetKappa.bind(this);
        this.inputsByNames['kappa'].addEventListener('change', handlerSetKappa);
        let name;
        for (name in this.inputsByNames) {
            //            console.log(item, ' -', gdfInputsByNames[item]);
            if (name != 'kappa') {
                this.inputsByNames[name].addEventListener('change', handlerSetCurrGasState);
            }
            this.inputsByNames[name].addEventListener('change', handlerUpdateFields);
        }
    }

    handlerSetCurrGasState(e) {
        console.log(this)
        this.currGasState = this.gasStateByName[e.target.name];
        this.currGasState.setArgument(e.target.value);
    }
    
    handlerSetKappa() {
        let name;
        for (name in this.gasStateByName) {
            this.gasStateByName[name].setKappa(this.inputsByNames['kappa'].value);
        }
    }

    handlerUpdateFields() {
        let name;
        for (name in this.inputsByNames) {
            this.inputsByNames[name].value = this.currGasState[this.getterByName[name]]();
        }
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

*/

controller = new Controller();
