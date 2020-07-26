
        class MyChart {
            constructor() {
                this.chart_element = document.getElementById('curve_chart');
                let on_load = this.on_load.bind(this);
                google.charts.setOnLoadCallback(on_load);
            }
            
            on_load() {
                this.__init_chart();
                this.__init_data();
                this.__init_options();
                this.__init_resize()
                this.draw();
            }
            
            __init_resize() {
                let on_resize = this.on_resize.bind(this);
                document.defaultView.addEventListener('resize', on_resize);
            }
            
            on_resize() {
                console.log('on resize');
                this.draw();
            }

            draw() {
                this.chart.draw(this.data, this.options);
//                this.chart.setSelection([{
//                    row: 38
//                    column: 1
//                }]);
            }
            
            __init_chart() {
                this.chart = new google.visualization.LineChart(this.chart_element);
            }
            
            __init_options() {
                this.options = {
                    hAxis: {
                        title: 'Time'
                    },
//                    vAxis: {
//                        title: 'Popularity'
//                    },
                    colors: ['#a52714', '#097138'],
                    crosshair: {
                        color: '#000',
                        trigger: 'selection'
                    }
                };
            }

            __init_data() {
                this.data = new google.visualization.DataTable();
                this.data.addColumn('number', 'X');
                this.data.addColumn('number', 'Dogs');
                this.data.addColumn('number', 'Cats');
                this.data.addRows([
                    [0, 0, 0],
                    [1, 10, 5],
                    [2, 23, 15],
                    [3, 17, 9],
                    [4, 18, 10],
                    [5, 9, 5],
                    [6, 11, 3],
                    [7, 27, 19],
                    [8, 33, 25],
                    [9, 40, 32]
                ]);
            }
        }
        
        google.charts.load('current', {
            packages: ['corechart', 'line']
        });
        my_chart = new MyChart();