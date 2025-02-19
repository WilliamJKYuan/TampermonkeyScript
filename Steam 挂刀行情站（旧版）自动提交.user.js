// ==UserScript==
// @name         Steam 挂刀行情站（旧版）自动提交 6.5.5
// @namespace    http://tampermonkey.net/
// @version      6.5.5
// @description  自动填写交易筛选的金额和成交量，并自动点击应用规则按钮
// @author       Yuan
// @match        *://iflow.work/*
// @match        *://www.iflow.work/*
// @grant        none
// @updateURL         https://raw.githubusercontent.com/WilliamJKYuan/TampermonkeyScript/main/Steam%20%E6%8C%82%E5%88%80%E8%A1%8C%E6%83%85%E7%AB%99%EF%BC%88%E6%97%A7%E7%89%88%EF%BC%89%E8%87%AA%E5%8A%A8%E6%8F%90%E4%BA%A4.user.js
// @downloadURL       https://raw.githubusercontent.com/WilliamJKYuan/TampermonkeyScript/main/Steam%20%E6%8C%82%E5%88%80%E8%A1%8C%E6%83%85%E7%AB%99%EF%BC%88%E6%97%A7%E7%89%88%EF%BC%89%E8%87%AA%E5%8A%A8%E6%8F%90%E4%BA%A4.user.js
// ==/UserScript==

(function() {
    'use strict';

    // 创建操作框
    function createControlPanel() {
        const panel = document.createElement('div');
        panel.style.position = 'fixed';
        panel.style.top = '10px';
        panel.style.right = '10px';
        panel.style.width = '300px';
        panel.style.backgroundColor = 'rgba(204, 204, 240, 0.8)'; // 半透明的高斯模糊背景
        panel.style.backdropFilter = 'blur(5px)'; // 高斯模糊效果
        panel.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.5)'; // 添加阴影效果
        panel.style.border = '1px solid black';
        panel.style.padding = '10px';
        panel.style.zIndex = '1000';
        panel.style.cursor = 'move';
        panel.style.borderRadius = '5px';
        panel.style.borderWidth = '0.5px';
        panel.style.borderColor= '#696969';
        panel.style.fontFamily = 'Microsoft YaHei UI, sans-serif';

        panel.innerHTML = `
        <h4 style="margin-top: 0; cursor: default; font-weight: bold; text-align: center;">自动提交设置</h4>
        <div style="display: flex; align-items: center; margin-bottom: 1px;">
            <label class="input-group-text" for="amountMin" style="flex: 1 35px;">CNY</label>
            <input type="text" class="form-control" id="amountMin" value="1" style="flex: 3; border-radius: 3px;">
            <label class="input-group-text" for="amountMax" style="flex: 1 35px;">To</label>
            <input type="text" class="form-control" id="amountMax" value="5000" style="flex: 3; border-radius: 3px;">
            <label class="input-group-text" for="amountMax" style="flex: 1 35px;">￥</label>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 1px;">
            <label class="input-group-text" for="volumeMin" style="flex: 1 35px;">成交量 ≥：</label>
            <input type="text" class="form-control" id="volumeMin" value="2" style="flex: 2; border-radius: 3px;">
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 1px;">
            <label class="input-group-text" for="interval" style="flex: 1 35px;">间隔秒数：</label>
            <input type="text" class="form-control" id="interval" value="10" style="flex: 2; border-radius: 3px;">
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 1px;">
            <label for="sortBy" class="input-group-text" style="flex: 1;">排序依据：</label>
            <select id="sortBy" class="form-control" style="flex: 2;">
                <option value="buyRadio">最优求购</option>
                <option value="safebuyRadio">稳定求购</option>
                <option value="sellRadio">最优寄售</option>
                <option value="mediansaleRadio">近期成交</option>
            </select>
        </div>
        <div id="countdown" style="text-align: center; font-size: 16px; font-weight: bold; margin: 10px 0;">提交倒计时</div>
        <div style="display: flex; align-items: center; margin-bottom: auto;">
           <button id="startAutoClick" class="btn btn-outline-primary" style="flex: 1; margin: auto;">开始自动提交</button>
           <button id="stopAutoClick" class="btn btn-outline-secondary" style="flex: 1; margin: auto;">停止自动提交</button>
        </div>
        <div style="align-items: center; margin-bottom: auto;">
           <button id="manualApply" class="btn btn-outline-primary" style="width: 100%; margin:10px 0;">应用规则</button>
        </div>
        `;

        document.body.appendChild(panel);

        let isDragging = false;
        let offsetX, offsetY;

        panel.addEventListener('mousedown', function(e) {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
            isDragging = true;
            offsetX = e.clientX - panel.offsetLeft;
            offsetY = e.clientY - panel.offsetTop;
        });

        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                panel.style.left = `${e.clientX - offsetX}px`;
                panel.style.top = `${e.clientY - offsetY}px`;
            }
        });

        document.addEventListener('mouseup', function() {
            isDragging = false;
        });

        document.getElementById('startAutoClick').addEventListener('click', startAutoClick);
        document.getElementById('stopAutoClick').addEventListener('click', stopAutoClick);
        document.getElementById('manualApply').addEventListener('click', manualApply);

        // 恢复保存的设置
        document.getElementById('amountMin').value = localStorage.getItem('amountMin') || '1';
        document.getElementById('amountMax').value = localStorage.getItem('amountMax') || '5000';
        document.getElementById('volumeMin').value = localStorage.getItem('volumeMin') || '2';
        document.getElementById('interval').value = localStorage.getItem('interval') || '10';
        document.getElementById('sortBy').value = localStorage.getItem('sortBy') || 'buyRadio';
    }

    // 填写表单
    function fillForm() {
        document.getElementById('minPrice').value = document.getElementById('amountMin').value;
        document.getElementById('maxPrice').value = document.getElementById('amountMax').value;
        document.getElementById('minVolume').value = document.getElementById('volumeMin').value;

        const sortBy = document.getElementById('sortBy').value;
        document.getElementById(sortBy).checked = true;

        // 保存设置到 localStorage
        localStorage.setItem('amountMin', document.getElementById('amountMin').value);
        localStorage.setItem('amountMax', document.getElementById('amountMax').value);
        localStorage.setItem('volumeMin', document.getElementById('volumeMin').value);
        localStorage.setItem('interval', document.getElementById('interval').value);
        localStorage.setItem('sortBy', sortBy);
    }

    //标记更新时间
    function updateRowColors() {
        // 获取所有表格行
        const rows = document.querySelectorAll('.table-container tbody tr');

        rows.forEach(row => {
            // 获取时间单元格
            const timeCell = row.cells[row.cells.length - 1];
            const timeText = timeCell.textContent.trim();

            let timeInSeconds = 0;
            // 判断时间文本的格式并转换为秒数
            if (timeText.includes(' ')) {
                // 如果是分钟和秒的格式 "mm ss"
                const [minutes, seconds] = timeText.split(' ');
                timeInSeconds = parseInt(minutes, 10) * 60 + parseInt(seconds.slice(0, -1), 10);
            } else {
                // 如果是秒的格式 "ss"
                timeInSeconds = parseInt(timeText.slice(0, -1), 10);
            }

            // 根据时间长短设置单元格样式
            if (timeInSeconds < 120) {
                // 小于2分钟，填充为深绿色
                timeCell.style.backgroundColor = 'darkgreen';
                timeCell.style.color = 'white';
            } else {
                // 大于2分钟，字体颜色改为红色
                //timeCell.style.color = 'red';
                // 大于2分钟，填充为深红色
                timeCell.style.backgroundColor = 'darkred';
                timeCell.style.color = 'white';
            }
        });
    }

    // 自动点击按钮并更新倒计时
    let autoClickInterval;
    let countdownInterval;

    function startAutoClick() {
        stopAutoClick();
        fillForm();
        const interval = parseInt(document.getElementById('interval').value) * 1000;
        let countdown = interval / 1000;

        autoClickInterval = setInterval(() => {
            document.getElementById('applySortBtn').click();
            countdown = interval / 1000; // 重置倒计时
        }, interval);

        /**
        //秒计倒计时
        countdownInterval = setInterval(() => {
            countdown--;
            document.getElementById('countdown').innerText = `提交倒计时: ${countdown}秒`;
            if (countdown <= 0) {
                countdown = interval / 1000;
            }
        }, 1000);
        **/
        //毫秒计倒计时
        countdownInterval = setInterval(() => {
            countdown -= 0.1;
            document.getElementById('countdown').innerText = `${countdown.toFixed(1)}秒后提交`;
            if (countdown <= 0) {
                countdown = interval / 1000;
            }
        }, 100);

        // 保存自动点击状态
        localStorage.setItem('autoClick', 'true');
    }

    function stopAutoClick() {
        clearInterval(autoClickInterval);
        clearInterval(countdownInterval);
        document.getElementById('countdown').innerText = '0秒后提交';

        // 移除自动点击状态
        localStorage.removeItem('autoClick');
    }

    //手动提交
    function manualApply() {
        fillForm();
        document.getElementById('applySortBtn').click();
    }

    // 初始化脚本
    function init() {
        createControlPanel();
        updateRowColors();

        // 检查是否有保存的自动点击状态
        if (localStorage.getItem('autoClick') === 'true') {
            startAutoClick();
        }
    }

    // 等待页面加载完成
    window.addEventListener('load', init);
})();
