const iterations = 10000000;
const date = new Date();

function testTemplate(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
}

function testConcat(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return year + (month < 10 ? '-0' : '-') + month + (day < 10 ? '-0' : '-') + day;
}

function testConcat2(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return year + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);
}

console.time('template');
for(let i=0; i<iterations; i++) {
    testTemplate(date);
}
console.timeEnd('template');

console.time('concat');
for(let i=0; i<iterations; i++) {
    testConcat(date);
}
console.timeEnd('concat');

console.time('concat2');
for(let i=0; i<iterations; i++) {
    testConcat2(date);
}
console.timeEnd('concat2');
