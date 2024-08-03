var box = document.getElementById('avatar');
var inputs = document.getElementById('inputs');
var http = new XMLHttpRequest();

var hidden = [
    'size','radius','backgroundType','backgroundRotation',
    'translateX','translateY','clip','randomizeIds',
    'beardProbability','earringsProbability','frecklesProbability','glassesProbability',
    'hairAccessoriesProbability'
];

var options;
var schema;

function values_to_args() {
    let args = '';
    for (i in options) {
        let option = options[i];
        let name = option.name;
        let value = option.value;

        if (value.startsWith('#')) {
            value = value.substring(1);
        };
        
        if (option.type == 'checkbox') {
            value = option.checked.toString();
        };

        if (value == '000000' || value == '' || value == 'false') {
            continue;
        };

        if (option.tagName == 'SELECT') {
            if (value != '') {
                args += name+'Probability=100&';
            };
        };

        if (value != null) {
            args += name+'='+value+'&';
        };
    }
    return args;
}

function args_to_values(args) {
    args = args.split('&amp;');
    let args_map = {};
    for (var i in args) {
        let [key, value] = args[i].split('=');
        args_map[key] = value;
    };

    for (k in args_map) {
        let v = args_map[k];
        
        if (k.endsWith('Probability')) {
            delete args_map[k];
        };
        if (k.endsWith('Color')) {
            args_map[k] = '#'+v;
        };
    };

    for (i in options) {
        let option = options[i];
        let name = option.name;

        if (args_map.hasOwnProperty(name)) {
            option.value = args_map[name];
        };

        if (name == 'flip' && option.value == 'true') {
            option.checked = true;
        };
    };
}

function save() {
    window.location.href = window.location.href+'?'+values_to_args();
}

function update() {
    let args = values_to_args();
    http.open('GET','https://api.keukeiland.nl/dicebear/7.x/lorelei/svg?'+args, true);
    http.onload = () => {
        box.innerHTML = http.responseText;
    };
    http.send();
}

function init() {
    for (var k in schema) {
        var v = schema[k];
        let input = document.createElement("input");
        let label = document.createElement("label");

        if (k.endsWith('Probability')) {
            v.type = 'boolean';
        };

        switch (v.type) {
            case 'string': {
                break;
            }
            case 'boolean': {
                input.setAttribute('type', 'checkbox');
                input.setAttribute('value', 'true');
                break;
            }
            case 'integer': {
                input.setAttribute('type', 'range');
                input.setAttribute('min', v.minimum);
                input.setAttribute('max', v.maximum);
                input.setAttribute('value', v.default);
                break;
            }
            case 'array': {
                if (v.items.pattern == "^(transparent|[a-fA-F0-9]{6})$") {
                    input.setAttribute('type', 'color');
                }
                else if (v.items.type == 'integer') {
                    input.setAttribute('type', 'range');
                    input.setAttribute('min', v.minimum);
                    input.setAttribute('max', v.maximum);
                    input.setAttribute('value', v.default);
                }
                else if (v.items.type == 'string') {
                    input = document.createElement('select');

                    let el = document.createElement('option');
                    el.setAttribute('value', 'false');
                    el.innerHTML = '';
                    input.appendChild(el);

                    for (var i in v.items.enum) {
                        let item = v.items.enum[i];
                        let el = document.createElement('option');
                        el.setAttribute('value', item);
                        el.innerHTML = item;
                        input.appendChild(el);
                    }
                }
                break;
            }
        }
        
        let row = inputs.insertRow(-1);
        
        let name = k.replace(/([A-Z])/g, " $1");
        label.innerHTML = name.toLowerCase();
        input.setAttribute('class', 'avatar-options');
        input.setAttribute('name', k);
        row.insertCell(-1).innerHTML = label.outerHTML;
        row.insertCell(-1).innerHTML = input.outerHTML;
    }

    options = Array.from(document.getElementsByClassName('avatar-options'));
    options.forEach(el => el.onchange = update);
}

let xhr = new XMLHttpRequest();
xhr.open('GET', 'https://api.keukeiland.nl/dicebear/7.x/lorelei/schema.json', true);
xhr.onload = () => {
    schema = JSON.parse(xhr.responseText).properties;

    for (var i in hidden) {
        delete schema[hidden[i]];
    };

    init();

    args_to_values(document.getElementById('old_code').innerHTML);

    update();
}
xhr.send();
