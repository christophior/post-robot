
import { util } from './util';
import { global } from '../global';
import { CONSTANTS } from '../conf';

global.domainMatches = global.domainMatches || [];

let domainMatchTimeout;

export function isSameDomain(win) {

    for (let match of global.domainMatches) {
        if (match.win === win) {
            return match.match;
        }
    }

    let match;

    try {
        if (util.getDomain(window) === util.getDomain(win)) {
            match = true;
        }
    } catch (err) {
        match = false;
    }

    global.domainMatches.push({
        win,
        match
    });

    if (!domainMatchTimeout) {
        domainMatchTimeout = setTimeout(() => {
            global.domainMatches = [];
            domainMatchTimeout = null;
        }, 1);
    }

    return match;
}

export function isWindow(item) {

    if (!item) {
        return false;
    }

    if (isSameDomain(item) !== false) {
        try {

            for (let key of [ 'setTimeout', 'setInterval', 'postMessage', 'alert' ]) {
                if (typeof item[key] !== 'function') {
                    return false;
                }
            }

            if (!item.document || !item.location) {
                return false;
            }

            return true;

        } catch (err) {
            // pass
        }
    }

    try {

        for (let i = 0; i < 5; i++) {
            if (item) {
                item = item[Math.random().toString()];
            }
        }

        return false;

    } catch (err) {

        return true;
    }
}


export function isWindowClosed(win) {

    try {

        if (!win || win.closed) {
            return true;
        }

        if (isSameDomain(win) && util.safeGet(win, 'mockclosed')) {
            return true;
        }

        return false;

    } catch (err) {
        // pass
    }

    return true;
}


export function getOpener(win) {

    if (!win) {
        return;
    }

    try {
        return win.opener;
    } catch (err) {
        return;
    }
}

export function getParent(win) {

    if (!win) {
        return;
    }

    try {
        if (win.parent && win.parent !== win) {
            return win.parent;
        }
    } catch (err) {
        return;
    }
}

export function getParents(win) {

    let result = [];

    try {

        while (win.parent !== win) {
            result.push(win.parent);
            win = win.parent;
        }

    } catch (err) {
        // pass
    }

    return result;
}

export function isAncestorParent(parent, child) {

    if (!parent || !child) {
        return false;
    }

    let childParent = getParent(child);

    if (childParent) {
        return childParent === parent;
    }

    if (getParents(child).indexOf(parent) !== -1) {
        return true;
    }

    return false;
}

export function getFrames(win) {

    let result = [];

    let frames;

    try {
        frames = win.frames;
    } catch (err) {
        frames = win;
    }

    let len;

    try {
        len = frames.length;
    } catch (err) {
        // pass
    }

    if (len === 0) {
        return result;
    }

    if (len) {
        for (let i = 0; i < len; i++) {

            let frame;

            try {
                frame = frames[i];
            } catch (err) {
                continue;
            }

            result.push(frame);
        }

        return result;
    }

    for (let i = 0; i < 100; i++) {
        let frame;

        try {
            frame = frames[i];
        } catch (err) {
            return result;
        }

        if (!frame) {
            return result;
        }

        result.push(frame);
    }

    return result;
}


export function getAllChildFrames(win) {

    let result = [];

    for (let frame of getFrames(win)) {
        result.push(frame);

        for (let childFrame of getAllChildFrames(frame)) {
            result.push(childFrame);
        }
    }

    return result;
}

export function getAllFramesInWindow(win) {

    let result = getAllChildFrames(win);

    result.push(win);

    for (let parent of getParents(win)) {

        result.push(parent);

        for (let frame of getFrames(parent)) {

            if (result.indexOf(frame) === -1) {
                result.push(frame);
            }
        }
    }

    return result;
}

export function getTop(win) {

    if (!win) {
        return;
    }

    try {
        if (win.top) {
            return win.top;
        }
    } catch (err) {
        // pass
    }

    if (getParent(win) === win) {
        return win;
    }

    try {
        if (isAncestorParent(window, win)) {
            return window.top;
        }
    } catch (err) {
        // pass
    }

    try {
        if (isAncestorParent(win, window)) {
            return window.top;
        }
    } catch (err) {
        // pass
    }

    for (let frame of getAllChildFrames(win)) {
        try {
            if (frame.top) {
                return frame.top;
            }
        } catch (err) {
            // pass
        }

        if (getParent(frame) === frame) {
            return frame;
        }
    }
}

export function getFrameByName(win, name) {

    for (let childFrame of getFrames(win)) {
        try {
            if (isSameDomain(childFrame) && childFrame.name === name && isWindow(childFrame)) {
                return childFrame;
            }
        } catch (err) {
            // pass
        }
    }

    try {
        if (isWindow(win.frames[name])) {
            return win.frames[name];
        }
    } catch (err) {
        // pass
    }

    try {
        if (isWindow(win[name])) {
            return win[name];
        }
    } catch (err) {
        // pass
    }
}

export function isParent(win, frame) {

    let frameParent = getParent(frame);

    if (frameParent) {
        return frameParent === win;
    }

    for (let childFrame of getFrames(win)) {
        if (childFrame === frame) {
            return true;
        }
    }

    return false;
}

export function isOpener(parent, child) {

    return parent === getOpener(child);
}

export function getAncestor(win) {
    win = win || window;

    let opener = getOpener(win);

    if (opener) {
        return opener;
    }

    let parent = getParent(win);

    if (parent) {
        return parent;
    }
}


export function isAncestor(parent, child) {

    let actualParent = getAncestor(child);

    if (actualParent) {
        if (actualParent === parent) {
            return true;
        }

        return false;
    }

    if (child === parent) {
        return false;
    }

    if (getTop(child) === child) {
        return false;
    }

    for (let frame of getFrames(parent)) {
        if (frame === child) {
            return true;
        }
    }

    return false;
}

export function isPopup() {
    return Boolean(getOpener(window));
}

export function isIframe() {
    return Boolean(getParent(window));
}

export function isFullpage() {
    return Boolean(!isIframe() && !isPopup());
}

export function getWindowType() {
    if (isPopup()) {
        return CONSTANTS.WINDOW_TYPES.POPUP;
    }
    if (isIframe()) {
        return CONSTANTS.WINDOW_TYPES.IFRAME;
    }
    return CONSTANTS.WINDOW_TYPES.FULLPAGE;
}


function anyMatch(collection1, collection2) {

    for (let item1 of collection1) {
        for (let item2 of collection2) {
            if (item1 === item2) {
                return true;
            }
        }
    }
}

export function isSameTopWindow(win1, win2) {

    let top1 = getTop(win1);
    let top2 = getTop(win2);

    try {
        if (top1 && top2) {
            if (top1 === top2) {
                return true;
            }

            return false;
        }
    } catch (err) {
        // pass
    }

    let allFrames1 = getAllFramesInWindow(win1);
    let allFrames2 = getAllFramesInWindow(win2);

    if (anyMatch(allFrames1, allFrames2)) {
        return true;
    }

    let opener1 = getOpener(top1);
    let opener2 = getOpener(top2);

    if (opener1 && anyMatch(getAllFramesInWindow(opener1), allFrames2)) {
        return false;
    }

    if (opener2 && anyMatch(getAllFramesInWindow(opener2), allFrames1)) {
        return false;
    }
}

export function jsonStringify() {

    let objectToJSON;
    let arrayToJSON;

    try {
        if (JSON.stringify({}) !== '{}') {
            objectToJSON = Object.prototype.toJSON;
            delete Object.prototype.toJSON;
        }

        if (JSON.stringify({}) !== '{}') {
            throw new Error(`Can not correctly serialize JSON objects`);
        }

        if (JSON.stringify([]) !== '[]') {
            arrayToJSON  = Array.prototype.toJSON;
            delete Array.prototype.toJSON;
        }

        if (JSON.stringify([]) !== '[]') {
            throw new Error(`Can not correctly serialize JSON objects`);
        }

    } catch (err) {
        throw new Error(`Can not repair JSON.stringify: ${err.message}`);
    }

    let result = JSON.stringify.apply(this, arguments);

    try {
        if (objectToJSON) {
            Object.prototype.toJSON = objectToJSON; // eslint-disable-line
        }

        if (arrayToJSON) {
            Array.prototype.toJSON = arrayToJSON; // eslint-disable-line
        }

    } catch (err) {
        throw new Error(`Can not repair JSON.stringify: ${err.message}`);
    }


    return result;
}

export function jsonParse() {
    return JSON.parse.apply(this, arguments);
}