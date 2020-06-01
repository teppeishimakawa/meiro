var address = 'http://54.199.165.221';

// 現在のブロック情報保管用
var blocks;

var socket = io(address);

// コントローラの情報を取得
socket.on('controller', function (data) {
    if (data.operation == 'forward') {
        forward();
    } else if (data.operation == 'jump') {
        if (!isJumped) {
            jump();
        }
    }
});

// 迷路の情報を取得
socket.on('maze_update', function (data) {
    var inputData = [];
    for (var i = 0; i < data.length; i++) {
        var raw = [];
        for (var j = 0; j < data[i].length; j++) {
            raw.push(data[j][i]);
        }
        inputData.push(raw);
    }
    blocks = inputData;

    clearBoxes(scene, stage);
    genBoxes(scene, stage, inputData);
});

// ジャンプ時のアニメーションを生成
var animate = function () {
    requestAnimationFrame(animate);
    TWEEN.update();
};
animate();
var tw, tw2;
var isJumped = false;

// ジャーーーンプ
function jump() {
    isJumped = true;
    var cam = document.getElementById('myCamera');
    var position = cam.getAttribute('position');

    var pos = {y: 0.5};

    tw = new TWEEN.Tween(pos)
        .to({y: 13}, 1500)
        .easing(TWEEN.Easing.Circular.Out)
        .onUpdate(function () {
            position.y = this.y;
            cam.setAttribute('position', position);
        })
        .onComplete(function () {
            isJumped = false;
        });

    tw2 = new TWEEN.Tween(pos)
        .to({y: 0.5}, 1500)
        .easing(TWEEN.Easing.Circular.In)
        .onUpdate(function () {
            position.y = this.y;
            cam.setAttribute('position', position);
        })
        .onComplete(function () {
            isJumped = false;
        });

    tw.chain(tw2);
    tw.start();
}

// ゴーーーール！！！！
function goal() {
    var goalObk = document.getElementById('goal');
    var position = goalObk.getAttribute('position');
    var pos = {y: 0.5};
    tw = new TWEEN.Tween(pos)
        .to({y: 10}, 10000)
        .easing(TWEEN.Easing.Quadratic.In)
        .onUpdate(function () {
            position.y = this.y;
            goalObk.setAttribute('position', position);
        })
        .onComplete(function () {
            position.y = -3;
            goalObk.setAttribute('position', position);
            console.log('comp');
        });
    tw.start();

    for (var i = 0; i < childObks.length; i++) {
        childObks[i].anim.start();
    }
}

// 自分の位置を送信
function sendPosition() {
    var cam = document.getElementById('myCamera');
    var position = cam.getAttribute('position');
    var rotation = cam.getAttribute('rotation');

    socket.emit('user_position', {
        x: position.x,
        y: position.y,
        z: position.z,
        rotate: rotation.y
    });
}

// 前進する
function forward() {
    var cam = document.getElementById('myCamera');

    var speed = 0.3;
    var position = cam.getAttribute('position');
    var rotation = cam.getAttribute('rotation');

    var nx = 8 + Math.floor(position.x + -Math.cos((rotation.y - 90) * Math.PI / 180) * speed);
    var ny = 8 + Math.floor(position.z + Math.sin((rotation.y - 90) * Math.PI / 180) * speed);
    if (blocks[nx] == undefined || blocks[nx][ny] == undefined || blocks[nx][ny] == '1') {

    } else {
        position.x += -Math.cos((rotation.y - 90) * Math.PI / 180) * speed;
        position.z += Math.sin((rotation.y - 90) * Math.PI / 180) * speed;
        cam.setAttribute('position', position);
        sendPosition();

        // ゴール判定
        if (dist(position, goalPos) < 1.5) {
            goal();
        }
    }
}

// 迷路を初期化する
function clearBoxes(scene, stage) {
    var n = scene.children.length;
    var removeList = [];
    for (var i = 0; i < n; i++) {
        if (scene.children[i].getAttribute('boxid')) {
            removeList.push(scene.children[i]);
        } else {

        }
    }

    for (var i in removeList) {
        scene.removeChild(removeList[i]);
    }
}

// 配列を受け取って迷路を作る
function genBoxes(scene, stage, arr) {
    var stageWidth = stage.getAttribute('width');
    var stageHeight = stage.getAttribute('height');
    var boxW = stageWidth / arr.length;
    var boxH = stageWidth / arr[0].length;
    for (var x = 0; x < 16; x++) {
        var outStr = '';
        for (var z = 0; z < 16; z++) {
            outStr += arr[x][z] + ',';
            if (arr[x][z] == '1') {
                var p = ((x + boxW / 2) - stageWidth / 2.0) + ' ' + boxW / 2.0 + ' ' + ((z + boxW / 2) - stageHeight / 2.0);
                var r = '0 0 0';
                var s = boxW + ' 1 ' + boxH;
                var c = '#323232';
                var boxNode = genBoxNode(p, r, s, c);
                boxNode.setAttribute('boxid', stage.getAttribute('id') + '_box' + x + '_' + z)
                scene.appendChild(boxNode);
            }
        }
    }
}

// 迷路用のボックスを作る
function genBoxNode(p, r, s, c) {
    var boxNode = document.createElement('a-box');
    boxNode.setAttribute('position', p);
    boxNode.setAttribute('rotation', r);
    var size = s.split(' ');
    boxNode.setAttribute('width', size[0]);
    boxNode.setAttribute('height', size[1]);
    boxNode.setAttribute('depth', size[2]);
    boxNode.setAttribute('color', c);

    return boxNode;
}

// おばけを作る(結局使ってないけど)
function genObakeNode(p, r, s, v_speed) {
    var modelNode = document.createElement('a-entity');
    var src = "src: url(./model/obake/obake3d.obj);mtl: url(./model/obake/obake3d.mtl);";
    modelNode.setAttribute('id', 'obake');
    modelNode.setAttribute('obj-loader', src);
    modelNode.setAttribute('position', p);
    modelNode.setAttribute('rotation', r);
    modelNode.setAttribute('scale', s);

    var animNode = document.createElement('a-animation');
    animNode.setAttribute('dur', v_speed);
    animNode.setAttribute('attribute', 'position');
    animNode.setAttribute('frome', '0 0.25 0.0');
    animNode.setAttribute('to', '0 0.35 0.0');
    animNode.setAttribute('direction', 'alternate-reverse');
    animNode.setAttribute('repeat', 'indefinite');
    animNode.setAttribute('easing', 'ease-out');

    modelNode.appendChild(animNode);
    return modelNode;
}

// キーボードテスト用
window.addEventListener("keydown", handleKeydown);

function handleKeydown(evt) {
    if (evt.key == "m") {
        // forward();
        if (!isJumped) {
            jump();
        }
    }
}