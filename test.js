var isHi = false;

function sayHi() {
    document.getElementById('p1').innerHTML = isHi ? 'yes' : 'no';
    isHi = !isHi;
}

