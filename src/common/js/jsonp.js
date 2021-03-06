import originJsonp from 'jsonp';

function param(data) {
    let url = '';
    for (let k in data) {
        let value = data[k] ? data[k] : '';
        url += '&' + k + '=' + encodeURIComponent(value);
    }
    return url ? url.substring(1) : '';
}

export default function jsonp(url, data, option) {
    return new Promise((resolve, reject) => {
        url += (url.indexOf('?') === -1 ? '?' : '&') + param(data);
        originJsonp(url, option, (err, data) => {
            if (!err) {
                resolve(data);
            } else {
                reject(err);
            }
        })
    });
}
