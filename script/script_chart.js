import {modelGdf} from './script_gdf.js'; 

class MyChart {
    
    // https://developers.google.com/chart
    
    constructor() {
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
            legend: { position: 'bottom' },
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

    update_chart(axes_names, columns_names, columns_data) {
        this.clear();
        this.columns_names = columns_names;
        this._set_options(axes_names);
        this._set_data_by_rows(columns_data);
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

    _set_data_by_rows(data_by_columns) {
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


google.charts.load('current', {
    packages: ['corechart', 'line']
});
let my_chart = new MyChart();
let axes_names = new Map([
    ['lambda', new Map([['x', 'lambda']])],
    ['mach', new Map([['x', 'mach']])]
]);
let columns_names = new Map([
    ['lambda', ['mach = f(lambda)']],
    ['mach', ['lambda = f(mach)']]
]);
let columns_data = new Map([
    ['lambda', [[1, 2, 3, 4, 5, 6], [0, 1, 2, 3, 3, 2]]],
    ['mach', [[1, 2, 3, 4, 5, 6], [2, 3, 3, 2, 1, 0]]]
]);

function on_select(e) {
    let val = e.target.value;
    my_chart.update_chart(axes_names.get(val), columns_names.get(val), columns_data.get(val));
    console.log(modelGdf.getActiveState());
}

let chart_args = document.getElementsByName('chart_arg');
//dict = new Map();
for (let chart_arg of chart_args) {
    chart_arg.addEventListener('change', on_select);
}
