var Painter = function(handler) {
    this.handler = handler;
};
Painter.prototype = {
    constructor: Painter,
    init: function(width, height, scale){
        this.width = width;
        this.height = height;
        this.scale = scale;
        this.render();
    },
    render: function(){
        let html = '';
        for (let row=0; row<this.height; row++) {
            html += '<div class="cube-row">';
            for (let col=0; col<this.width; col++) {
                html += '<div class="cube"></div>';
            }
            html += '<div style="clear:both;"></div></div>';
        }
        this.handler.html(html);
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
                }
                f.colorMaker.setColor(changeColor[0], changeColor[1], changeColor[2]);
            } else {
                console.log('---->', '选择了纯红色');
                f.colorMaker.setColor(255, 0, 0);
            }
        });
    }
};
