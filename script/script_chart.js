import {
    modelGdf
} from './script_gdf.js';
import {
    ModelGdf
} from './script_gdf.js';


class ControllerChart {

    // https://developers.google.com/chart

    constructor() {
        google.charts.load('current', {
            packages: ['corechart', 'line']
        });
        this.chart_element = document.getElementById('curve_chart');
        this.init();
    }

    init() {
        // axes_names = Map('x': 'x_name', 'y': 'y_name')
        // columns_names = [line1_name, line2_name, ...]
        // columns_data = [[x_vals], [line1_y_vals], [line2_y_vals], ...]
        let axes_names = new Map([['x', 'axis X'], ['y', 'axis Y']]);
        let columns_names = ['default line is just the CS origin'];
        let data_by_columns = [[0.0], [0.0]];
        this.columns_names = columns_names;
        this._init_options();
        this._set_options(axes_names);
        this._set_data_by_rows(data_by_columns);
        this._init_chart();
        this._init_resize();
        this._init_on_display();
    }

    _init_options() {
        // defines this.options
        this.options = {
            hAxis: {
                title: 'x_axis_name'
            },
            vAxis: {
                title: 'y_axis_name'
            },
            colors: ['blue', 'red', 'green', 'orange', 'gray'],
            legend: {
                position: 'bottom'
            },
            width: 200,
            height: 100,
        };
    }

    _init_chart() {
        let google_callback = this._google_callback.bind(this);
        google.charts.setOnLoadCallback(google_callback);
    }

    _init_resize() {
        let on_resize = this.on_resize.bind(this);
        document.defaultView.addEventListener('resize', on_resize);
    }

    _init_on_display() {
        let on_display = this.on_display.bind(this);
        let tab_chart = document.getElementById('tab_chart');
        tab_chart.addEventListener('click', on_display);
    }

    _google_callback() {
        this.chart = new google.visualization.LineChart(this.chart_element);
        this.data = new google.visualization.DataTable();
        this._set_data_to_chart();
        this.draw();
    }

    update_chart(axes_names, columns_names, columns_data, curves_num) {
        this.clear();
        this.columns_names = columns_names;
        this._set_options(axes_names);
        this._set_data_by_rows(columns_data, curves_num);
        this._set_data_to_chart();
        this.draw();
    }

    clear() {
        this.data.removeRows(0, 1000000); // right limit is arbitrary
        this.data.removeColumns(0, 1000); // right limit is arbitrary
    }

    _set_options(axes_names) {
        let x_axis_name = axes_names.get('x') === undefined ? '' : axes_names.get('x');
        let y_axis_name = axes_names.get('y') === undefined ? '' : axes_names.get('y');
        this.options.hAxis.title = x_axis_name;
        this.options.vAxis.title = y_axis_name;
    }

    _set_data_by_rows(data_by_columns, curves_num) {
        // defines this.points_data
        this.data_by_rows = [];
        for (let i = 0; i < data_by_columns[0].length; i++) {
            let curr_point = [];
            for (let line of data_by_columns) {
                curr_point.push(line[i]);
            }
            this.data_by_rows.push(curr_point);
        }
    }

    _set_data_to_chart() {
        this.data.addColumn('number', 'X');
        for (let line_name of this.columns_names) {
            this.data.addColumn('number', line_name);
        }
        this.data.addRows(this.data_by_rows);
    }

    on_display() {
        this.options.width = this.chart_element.clientWidth;
        this.options.height = this.chart_element.clientHeight;
        this.draw();
    }

    on_resize() {
        this.options.width = 0;
        this.options.height = 0;
        this.draw();
    }

    draw() {
        this.chart.draw(this.data, this.options);
    }

}

class ModelChart {
    constructor() {
        this.model_gdf = new ModelGdf();
        this.lines = new Map();
        this.init_line_lyamb();
        this.init_lines();
    }

    init_line_lyamb() {
        this.lines.set('lambda', []);
        let arr = this.lines.get('lambda');
        let min_val = this.model_gdf.getMinOf('lambda');
        let max_val = this.model_gdf.getMaxOf('lambda') * 0.99;
        let dots_num = 100;
        let step = (max_val - min_val) / (dots_num - 1);
        let curr_mach = 0.0;
        for (let curr_val = min_val; curr_val <= max_val; curr_val += step) {
            arr.push(curr_val);
        }
    }

    init_lines() {
        this.lines.set('mach', []);
        let arr_mach = this.lines.get('mach');
        let arr_lambda = this.lines.get('lambda');
        for (let lambda of arr_lambda) {
            this.model_gdf.setField('lambda', lambda);
            let state = this.model_gdf.getActiveState();
            arr_mach.push(state.get('mach'));
        }
    }

    get_line_by_name(line_name) {
        return this.lines.get(line_name);
    }
}

class ControllerChartTab {
    constructor() {
        this.controller_chart = new ControllerChart();
        this.model_chart = new ModelChart();
        this.axes_names = new Map([['x', 'x_name'], ['y', 'y_name']]);
        this.columns_names = [];
        this.columns_data = [];
        this.chart_args = document.getElementsByName('chart_arg');
        let on_arg_change = this.on_arg_change.bind(this);
        for (let chart_arg of this.chart_args) {
            chart_arg.addEventListener('change', on_arg_change);
        }
    }

    on_arg_change(e) {
        let arg_name = e.target.value;
        let fun_name = 'lambda';
        if (arg_name == 'lambda') {
            fun_name = 'mach';
        }
        let curves_num = 1;
        let arg_line = this.model_chart.get_line_by_name(arg_name);
        let fun_line = this.model_chart.get_line_by_name(fun_name);
        this.columns_data[0] = arg_line;
        this.columns_data[1] = fun_line;
        this.axes_names.set('x', arg_name);
        this.axes_names.set('y', fun_name);
        this.columns_names[0] = fun_name + '=f(' + arg_name + ')';
        this.controller_chart.update_chart(this.axes_names, this.columns_names, this.columns_data, curves_num);
    }
}

let controller_chart_tab = new ControllerChartTab();


//let axes_names = new Map([
//    ['lambda', new Map([['x', 'lambda']])],
//    ['mach', new Map([['x', 'mach']])]
//]);
//let columns_names = new Map([
//    ['lambda', ['mach = f(lambda)']],
//    ['mach', ['lambda = f(mach)']]
//]);
//let columns_data = new Map([
//    ['lambda', [[1, 2, 3, 4, 5, 6], [0, 1, 2, 3, 3, 2]]],
//    ['mach', [[1, 2, 3, 4, 5, 6], [2, 3, 3, 2, 1, 0]]]
//]);
