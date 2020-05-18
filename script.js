function splitElementsByName(elements) {
    let elementsByClassNames = new Map();
    for (let item of elements) {
        elementsByClassNames[item.name] = item;
    }
    return elementsByClassNames;
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

    setMach(mach) {
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

    setLambda(lambda) {
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
            this.setLambda(lambda);
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

    setQu(qu) {
        this.qu = +qu;
        this.wrappedState.setLambda(
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

    setPi(pi) {
        this.pi = +pi;
        this.wrappedState.setMach(
            Math.sqrt((Math.pow(1.0 / this.pi, (this.getKappa() - 1.0) / this.getKappa()) - 1.0) * 2.0 / (this.getKappa() - 1.0))
        );
    }

    getPi() {
        return this.pi;
    }
}

class GasStateByTau  extends GasStateDelegate {
    constructor() {
        super(new GasStateByMach());
    }

    setTau(tau) {
        this.tau = +tau;
        this.wrappedState.setMach(
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
    
    setEpsilon(epsilon) {
        this.epsilon = +epsilon;
        this.wrappedState.setMach(
            Math.sqrt((Math.pow(1.0 / this.epsilon, this.getKappa()-1.0)-1.0)*2.0/(this.getKappa()-1.0))
        );
    }
    
    getEpsilon() {
        return this.epsilon;
    }
}

function updateFields(fields, state) {
    fields['kappa'].value = state.getKappa();
    fields['mach'].value = state.getMach();
    fields['lambda'].value = state.getLambda();
    fields['pi'].value = state.getPi();
    fields['tau'].value = state.getTau();
    fields['epsilon'].value = state.getEpsilon();
    fields['qu'].value = state.getQu();
}

let inputs = document.querySelectorAll('.function_block input');
let inputsByNames = splitElementsByName(inputs);

//let stateByMach = new GasStateByMach();
//console.log('stateByMach');
//updateFields(inputsByNames, stateByMach);

//let stateByLambda = new GasStateByLambda();
//console.log('stateByLambda');
//updateFields(inputsByNames, stateByLambda);

//let stateByQu = new GasStateByQu();
//console.log('stateByQu');
//stateByQu.setQu(0.5);
//updateFields(inputsByNames, stateByQu);

//let stateByPi = new GasStateByPi();
//console.log('stateByPi');
//stateByPi.setPi(0.5);
//updateFields(inputsByNames, stateByPi);

//let stateByTau = new GasStateByTau();
//console.log('stateByTau');
//stateByTau.setTau(0.5);
//updateFields(inputsByNames, stateByTau);

let stateByEpsilon = new GasStateByEpsilon();
console.log('stateByTau');
stateByEpsilon.setEpsilon(0.5);
updateFields(inputsByNames, stateByEpsilon);

//updateFields(inputsByNames, stateByQu);
