var Painter = function(handler) {
    this.handler = handler;
    this.showGrid = true;
    this.scale = 30;
    this.canvas = [];
    this.data = null;
};
Painter.prototype = {
    constructor: Painter,
    load: function(file) {
        if (file.substring(0,1) == '{') {
            this.data = JSON.parse(file);
        }
    },
    newFile: function(fileName, cuteType, width, height, bgColor){},
    mergeLayer: function() {
        if (this.data != null) {
            let i = this.data.layers.length;
            while (--i >= 0) {
                let onColor = 0;
                if (this.data.layers[i].display) {
                    for (let j in this.data.layers[i].cubes) {
                        let cube = this.data.layers[i].cubes[j];
                        if (cube != 0) {
                            if (cube == 1) {
                                this.canvas[j] = onColor;
                            } else {
                                this.canvas[j] = cube;
                                onColor = cube;
                            }
                        } else {
                            onColor = 0;
                        }
                    }
                }
            }
            console.log(this.canvas);
        } else {
            console.error('图层数据缺失');
        }
    },
    render: function(){
        this.mergeLayer();
        if (this.canvas.length > 1) {
            let rowStyle = 'height:' + this.scale + 'px;' + (this.showGrid && 'margin-bottom:1px');
            let cubeStyle = 'width:' + this.scale + 'px;height:' + this.scale + 'px;'
                + (this.showGrid && 'margin-left:1px');
            let html = '';
            let i = 0;
            for (let row=0; row<this.data.height; row++) {
                html += '<div style="'+rowStyle+'">';
                for (let col=0; col<this.data.width; col++) {
                    let color = ';background:rgb('+this.canvas[i][0]+','+this.canvas[i][1]+','+this.canvas[i][2]+')'
                    html += '<div class="cube" style="'+cubeStyle+color+'"></div>';
                    ++i;
                }
                html += '</div>';
            }
            this.handler.html(html);
        } else {
            console.error('画布数据缺失');
        }
    }
};

var ColorMaker = function(handler, panel) {
    this.handler = handler;
    this.panel = panel;
    this.color = [0, 0, 0];
    this.defaultColor = ['red', 'green', 'blue'];
    this.currentIndex = -1;
    this.clickDown = false;
    this.init();
};
ColorMaker.prototype = {
    constructor: ColorMaker,
    init: function() {
        var f = this;
        this.handler.on('mousedown', '.progress-bar', function(e){
            f.clickDown = true;
            f.currentIndex = f.handler.find('.progress-bar').index($(this));
            f.setPosition(e);
        });
        this.handler.on('mousemove', '.progress-bar', function(e){
            if (f.clickDown) {
                f.setPosition(e);
            }
        });
        this.handler.on('mouseup', '.progress-bar', function(){
            if (f.clickDown) {
                f.clickDown = false;
            }
        });
        this.handler.on('mouseout', '.progress-bar', function(){
            if (f.clickDown) {
                f.clickDown = false;
            }
        });
        this.handler.on('focus', 'input', function(){
            let input = $(this);
            let val = input.val();
            let index = f.handler.find('input').index(input);
            input.one('blur', function(){
                let nv = $(this).val();
                if (/^\d+$/.test(nv) && nv > -1 && nv < 256) {
                    val = nv;
                } else if (/^[A-Fa-f0-9]+$/.test(nv)) {
                    nv = parseInt(nv, 16).toString(10);
                    if (nv > -1 && nv < 256) {
                        val = nv;
                    }
                }
                input.val(val);
                f.color[index] = parseInt(val);
                f.setColor();
            });
        });
        this.handler.on('keydown', 'input', function(e){
            if (e.keyCode == 13) {
                $(this).blur();
            }
        });
    },
    setPosition: function(event) {
        let per = event.offsetX / event.currentTarget.clientWidth;
        this.color[this.currentIndex] = parseInt(per * 255);
        this.setColor();
    },
    setColor: function(R, G, B){
        if (R != undefined) {
            this.color[0] = R;
        }
        if (G != undefined) {
            this.color[1] = G;
        }
        if (B != undefined) {
            this.color[2] = B;
        }
        let f = this;
        let i = 0;
        this.handler.find('input').each(function(){
            $(this).val(f.color[i++]);
        });
        i = 0;
        this.handler.find('.progress-bar').each(function(){
            let per = f.color[i] / 255;
            let bg = 'background: linear-gradient(to right, '+f.defaultColor[i]
            +' '+per*100+'%,white '+per*100+'%);';
            $(this).attr('style', bg);
            i++;
        });
        this.panel.attr('style', 'background: '+this.getColor());
    },
    getColor: function(){
        return 'rgb('+this.color[0]+','+this.color[1]+','+this.color[2]+')';
    }
};

var ColorPicker = function(handler, colorMaker){
    this.handler = handler;
    this.colorMaker = colorMaker;
    this.step = 11;
    this.colors = [[255,0,0],[255,182,0],[255,246,0],[165,255,0],[0,169,255],[4,0,255],[138,0,252],[255,0,233],[255,0,59],[255,0,0]];
    this.init();
};
ColorPicker.prototype = {
    constructor: ColorPicker,
    init: function(){
        var f = this;
        this.handler.on('click', function(e){
            let perX = e.offsetX / e.currentTarget.clientWidth * 100;
            let perY = e.offsetY / e.currentTarget.clientHeight * 100;
            if (perX > 0 && perX < 100) {
                let i = 0, j = -1;
                for (; i < perX; i += f.step, j++);
                let s = parseInt(j+''+j);
                let offsetX = (perX - s) / f.step;

                let baseColor = f.colors[j];
                let offsetColor = f.colors[j+1];
                let changeColor = [0, 0, 0];
                i = 3;
                while (i--) {
                    x = baseColor[i];
                    y = offsetColor[i];
                    //调整色相
                    if (x < y) {
                        changeColor[i] = parseInt((y - x) * offsetX + x);
                    } else if (x > y) {
                        changeColor[i] = parseInt(x - (x - y) * offsetX);
                    } else {
                        changeColor[i] = x;
                    }
                    if (changeColor[i] < 0) {
                        changeColor[i] = 0;
                    }
                    //调整明度
                    x = changeColor[i];
                    let zColor = [255, 255, 255];
                    let offsetY = 0;
                    if (perY > 50) {
                        offsetY = (perY - 50) * 2 / 100;
                        zColor = [0, 0, 0];
                    } else if (perY < 50) {
                        offsetY = (100 - perY * 2) / 100;
                    }
                    z = zColor[i];
                    if (x < z) {
                        changeColor[i] = parseInt((z - x) * offsetY + x);
                    } else if (x > z) {
                        changeColor[i] = parseInt(x - (x - z) * offsetY);
                    } else {
                        changeColor[i] = z;
                    }
                    if (changeColor[i] < 0) {
                        changeColor[i] = 0;
                    } else if (changeColor[i] > 255) {
                        changeColor[i] = 255;
                    }
                }
                f.colorMaker.setColor(changeColor[0], changeColor[1], changeColor[2]);
            } else {
                console.log('---->', '选择了纯红色');
                f.colorMaker.setColor(255, 0, 0);
            }
        });
    }
};
