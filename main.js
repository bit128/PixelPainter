var Painter = function(handler) {
    this.handler = handler;
    this.hasChange = false;
    this.x = 0;
    this.y = 0;
    this.showGrid = false;
    this.scale = 1;
    this.data = null;
    this.colorManager = null;
    this.layerManager = null;
    this.toolMode = '';
    this.init();
    this.windowEvent();
};
Painter.prototype = {
    constructor: Painter,
    init: function() {
        let f = this;
        $('.tools').on('click', function(){
            f.toolMode = $(this).attr('data-val');
            $('.tools').removeClass('checked');
            $(this).addClass('checked');
        });
        let mouseDown = false;
        $('body').on('mousedown', function(){
            mouseDown = true;
        });
        $('body').on('mouseup', function(){
            mouseDown = false;
            f.render();
        });
        this.handler.on('mousedown', '.cube', function(){
            let index = f.handler.find('.cube').index($(this));
            f.paint(index, $(this));
        });
        this.handler.on('mouseover', '.cube', function(){
            let index = f.handler.find('.cube').index($(this));
            if (mouseDown) {
                f.paint(index, $(this));
            }
            f.x = index%f.data.width;
            f.y = parseInt(index/f.data.height);
            $('.canvas label').find('span').html('X: '+f.x+' Y: '+f.y);
        });
        this.handler.on('mouseout', function(){
            f.x = 0;
            f.y = 0;
            $('.canvas label').find('span').html('X: '+f.x+' Y: '+f.y);
        });
    },
    windowEvent: function() {
        let f = this;
        $('.canvas').on('click', 'a', function() {
            switch ($('.canvas').find('a').index($(this))) {
                case 0:
                    if ($(this).hasClass('checked')) {
                        $(this).removeClass('checked');
                        f.showGrid = false;
                        f.render();
                    } else {
                        $(this).addClass('checked');
                        f.showGrid = true;
                        f.render();
                    }
                    break;
                case 1:
                    if (f.scale < 5) {
                        f.scale++;
                        f.render();
                    }
                    break;
                case 2:
                    if (f.scale > 0) {
                        f.scale--;
                        f.render();
                    }
            }
        });
    },
    setTool: function(tool) {
        $('.tools').removeClass('checked');
        $('.tools[data-val="'+tool+'"]').addClass('checked');
        this.toolMode = tool;
    },
    paint: function(index, cube) {
        switch (this.toolMode) {
            case 'pen':
                cube.attr('style', 'background:'+this.colorManager.getColor());
                this.layerManager.paintCube(index, JSON.parse(JSON.stringify(this.colorManager.color)));
                break;
            case 'clear':
                cube.removeAttr('style');
                this.layerManager.paintCube(index, 0);
                break;
            case 'pick':
                let color = cube.attr('style').replace('background:rgb(', '[').replace(')',']');
                this.colorManager.setColor(JSON.parse(color));
                break;
        }
    },
    newFile: function(fileName, width, height, bgColor){
        if (! this.hasChange) {
            this.data = {
                fileName: fileName,
                cuteType: 1,
                width: width,
                height: height,
                bgColor: bgColor,
                layers: []
            };
            if (! Array.isArray(bgColor)) {
                bgColor = ColorPanel.prototype.hexToDigit(bgColor);
            }
            let matrix = width * height;
            this.layerManager.newLayer(matrix, bgColor, '背景层');
            this.layerManager.newLayer(matrix, 0, '绘图层');
        } else {
            alert('请先保存您的文件');
        }
    },
    render: function(){
        let layer = this.layerManager.getMergeLayer();
        if (layer.length > 1) {
            let html = '';
            let i = 0;
            for (let row=0; row<this.data.height; row++) {
                html += '<div class="cube-row cube-row-'+this.scale+'">';
                for (let col=0; col<this.data.width; col++) {
                    let color = 'rgba(0,0,0,0)';
                    if (layer[i] != 0) {
                        color = 'rgb('+layer[i][0]+','+layer[i][1]+','+layer[i][2]+')';
                    }
                    html += '<div class="cube cube-'+this.scale+'" style="background:'+color+'"></div>';
                    ++i;
                }
                html += '</div>';
            }
            this.handler.html(html);
            if (this.showGrid) {
                this.handler.find('.cube-row').addClass('grid');
                this.handler.find('.cube').addClass('grid');
            }
            let cavansWdith = $('body').width() - $('.toolbox').width() - $('.setting').width();
            $('.canvas').width(cavansWdith);
            $('.canvas label').html('width: '+this.data.width+'&nbsp; height: '+this.data.height
                +'&nbsp; scale: '+this.scale+'&nbsp;&nbsp;&nbsp;&nbsp;<span></span>');
        } else {
            console.error('画布数据缺失');
        }
    }
};

var ColorPanel = function(maker, picker) {
    this.maker = maker;
    this.picker = picker;
    this.color = [0, 0, 0];
    this.defaultColor = ['red', 'green', 'blue'];
    this.currentIndex = -1;
    this.clickDown = false;
    this.step = 11;
    this.colors = [[255,0,0],[255,182,0],[255,246,0],[165,255,0],[0,169,255],[4,0,255],[138,0,252],[255,0,233],[255,0,59],[255,0,0]];
    this.init();
};
ColorPanel.prototype = {
    constructor: ColorPanel,
    init: function() {
        let f = this;
        this.maker.on('mousedown', '.progress-bar', function(e){
            f.clickDown = true;
            f.currentIndex = f.maker.find('.progress-bar').index($(this));
            f.setPosition(e);
        });
        this.maker.on('mousemove', '.progress-bar', function(e){
            if (f.clickDown) {
                f.setPosition(e);
            }
        });
        this.maker.on('mouseup', '.progress-bar', function(){
            if (f.clickDown) {
                f.clickDown = false;
            }
        });
        this.maker.on('mouseout', '.progress-bar', function(){
            if (f.clickDown) {
                f.clickDown = false;
            }
        });
        this.maker.on('focus', 'input', function(){
            let input = $(this);
            let val = input.val();
            let index = f.maker.find('input').index(input);
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
        this.maker.on('keydown', 'input', function(e){
            if (e.keyCode == 13) {
                $(this).blur();
            }
        });
        this.picker.on('click', function(e){
            let perX = e.offsetX / e.currentTarget.clientWidth * 100;
            let perY = e.offsetY / e.currentTarget.clientHeight * 100;
            if (perX > 0 && perX < 100) {
                let i = 0, j = -1;
                for (; i < perX; i += f.step, j++);
                let startColors = f.colors[j];
                let endColors = f.colors[j<9 ? j+1 : 1];
                let grayColors = [255, 255, 255];
                //计算色相偏移
                let s = parseInt(j+''+j);
                let offsetX = (perX - s) / f.step;
                //计算灰度偏移
                let offsetY = 0;
                if (perY > 50) {
                    offsetY = (perY - 50) * 2 / 100;
                    grayColors = [0, 0, 0];
                } else if (perY < 50) {
                    offsetY = (100 - perY * 2) / 100;
                }
                //开始调整
                i = 3;
                let results = [0, 0, 0];
                while (i--) {
                    //调整色相
                    results[i] = f.changeToColor(startColors[i], endColors[i], offsetX);
                    //调整明度
                    results[i] = f.changeToColor(results[i], grayColors[i], offsetY);
                }
                f.setColor(results);
            }
        });
    },
    setPosition: function(event) {
        let per = event.offsetX / event.currentTarget.clientWidth;
        this.color[this.currentIndex] = parseInt(per * 255);
        this.setColor();
    },
    setColor: function(color){
        if (Array.isArray(color)) {
            this.color = color;
        } else if (color) {
            this.color = this.hexToDigit(color);
        }
        let f = this;
        let i = 0;
        this.maker.find('input').each(function(){
            $(this).val(f.color[i++]);
        });
        i = 0;
        this.maker.find('.progress-bar').each(function(){
            let per = f.color[i] / 255;
            let bg = 'background: linear-gradient(to right, '+f.defaultColor[i]
            +' '+per*100+'%,white '+per*100+'%);';
            $(this).attr('style', bg);
            i++;
        });
        $('.color-panel').attr('style', 'background: '+this.getColor());
    },
    hexToDigit: function(hex) {
        if (hex.substring(0,1) == '#') {
            hex = hex.substring(1, hex.length);
        }
        if (/^[A-Fa-f0-9]{6}$/.test(hex)) {
            let colors = [];
            for (let i=0,j=0; i<6; i+=2,j++) {
                colors[j] = parseInt(parseInt(hex.substring(i, i+2), 16).toString(10));
            }
            return colors;
        }
        return hex;
    },
    changeToColor: function(fromColor, toColor, offset){
        let color;
        if (fromColor < toColor) {
            color = parseInt((toColor - fromColor) * offset + fromColor);
        } else if (fromColor > toColor) {
            color = parseInt(fromColor - (fromColor - toColor) * offset);
        } else {
            color = fromColor;
        }
        return color;
    },
    getColor: function(){
        return 'rgb('+this.color[0]+','+this.color[1]+','+this.color[2]+')';
    }
};

var LayerPanel = function(handler) {
    this.handler = handler;
    this.listHandler = $('#layer_list');
    this.refreshCallback = null;
    this.matrix = 0;
    this.currentLayer = 0;
    this.layers = [];
    this.init();
};
LayerPanel.prototype = {
    constructor: LayerPanel,
    init: function(){
        let f = this;
        this.handler.on('click', '.layer-edit a', function(){
            switch (f.handler.find('.layer-edit a').index($(this))) {
                case 0:
                    f.newLayer();
                    break;
                case 1:
                    f.copyLayer();
                    break;
                case 2:
                    f.deleteLayer();
                    break;
            }
        });
        this.listHandler.on('click', '.layer-item', function(){
            f.currentLayer = f.listHandler.find('.layer-item').removeClass('checked').index($(this));
            $(this).addClass('checked');
        });
        this.listHandler.on('blur', 'input', function(){
            f.layers[f.listHandler.find('input').index($(this))].name = $(this).val() || '未命名图层';
        });
    },
    paintCube: function(index, color) {
        if (this.currentLayer != -1) {
            this.layers[this.currentLayer].cubes[index] = color;
        }
    },
    newLayer: function(length, bgColor, name) {
        if (length == undefined) {
            length = this.matrix;
        } else {
            this.matrix = length;
        }
        if (bgColor == undefined) {
            bgColor = 0;
        }
        if (name == undefined) {
            name = '未命名图层';
        }
        let layer = {
            name: name,
            display: true,
            cubes: []
        };
        for (let i=0; i<length; i++) {
            layer.cubes[i] = bgColor;
        }
        this.layers.unshift(layer);
        this.currentLayer = 0;
        this.renderList();
    },
    copyLayer: function() {
        if (this.currentLayer != -1) {
            let layer = JSON.parse(JSON.stringify(this.layers))[this.currentLayer]; 
            layer.name += '-拷贝';
            this.layers.unshift(layer);
            this.currentLayer = 0;
            this.renderList();
        } else {
            alert('请先选择要复制的图层');
        }
    },
    deleteLayer: function() {
        if (this.currentLayer != -1) {
            if (confirm('确定要删除选择的图层吗？')) {
                this.layers.splice(this.currentLayer, 1);
                this.currentLayer = -1;
                this.renderList();
                if (this.refreshCallback != null) {
                    this.refreshCallback();
                }
            }
        } else {
            alert('请先选择要删除的图层');
        }
    },
    getMergeLayer: function() {
        let layer = [];
        for (let m=0; m<this.matrix; m++) {
            layer[m] = 0;
        }
        let i = this.layers.length;
        while (--i >= 0) {
            if (this.layers[i].display) {
                for (let j in this.layers[i].cubes) {
                    let cube = this.layers[i].cubes[j];
                    if (cube != 0) {
                        layer[j] = cube;
                    }
                    /*
                    if (cube != 0) {
                        if (cube == 1) {
                            layer[j] = onColor;
                        } else {
                            layer[j] = cube;
                            onColor = cube;
                        }
                    } else {
                        onColor = 0;
                    }*/
                }
            }
        }
        return layer;
    },
    renderList: function() {
        let html = '';
        for (let item of this.layers) {
            html += '<div class="pure-g layer-item"><div class="pure-u-1-5">';
            if (item.isLock) {
                html += '<img src="images/ic-lock.png" />';
            } else if (item.display) {
                html += '<img src="images/ic-eye.png" />';
            } else {
                html += '<img src="images/ic-eyec.png" />';
            }
            html += '</div><div class="pure-u-4-5"><input type="text" value="'+item.name+'" /></div></div>';
        }
        this.listHandler.html(html);
        if (this.currentLayer != -1) {
            this.listHandler.find('.layer-item').eq(this.currentLayer).addClass('checked');
        }
    }
};
