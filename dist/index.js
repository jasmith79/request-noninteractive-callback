"use strict";
/**
 * @description Monitors DOM elements for interactivity, fires registered
 * callbacks n milliseconds after interaction stops.
 *
 * @author jasmith79
 * @license MIT
 * @copyright 2020
 */
Object.defineProperty(exports, "__esModule", { value: true });
var InteractiveEvents;
(function (InteractiveEvents) {
    InteractiveEvents["MOUSEMOVE"] = "mousemove";
    InteractiveEvents["ALPHANUM"] = "keypress";
    InteractiveEvents["ANY_KEY"] = "keydown";
    InteractiveEvents["CLICK"] = "click";
    InteractiveEvents["CHANGE"] = "change";
})(InteractiveEvents = exports.InteractiveEvents || (exports.InteractiveEvents = {}));
const assertExists = (x, message = 'Object unexpectedly null') => {
    if (x == null)
        throw new Error(message);
    return x;
};
const debounce = (n, immed, f) => {
    let [func, now] = (() => {
        switch (Object.prototype.toString.call(immed)) {
            case '[object Boolean]':
                return [f, immed];
            case '[object Function]':
                return [immed, false];
            default:
                throw new TypeError(`Unrecognized arguments ${immed} and ${f} to function deb.`);
        }
    })();
    let fn = func;
    let timer = -1;
    return function (...args) {
        if (timer === -1 && now) {
            fn.apply(this, args);
        }
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), n);
        return timer;
    };
};
/**
 * @description Provides a convenience wrapper for monitoring forms: it won't call the
 * wrapped callback if the form is invalid or hasn't changed since the last call.
 *
 * @param selector The CSS selector for the form.
 * @param f The callback to wrap and pass FormData to.
 * @returns A handler function to register.
 */
exports.formHelper = (selector, f) => {
    let lastState = '';
    return async () => {
        var _a;
        const elem = document.getElementById(selector);
        if (!elem) {
            throw new Error(`No element matches selector '${selector}.`);
        }
        if (!((_a = elem) === null || _a === void 0 ? void 0 : _a.elements)) {
            throw new Error(`Element matched by '${selector} does not appear to be a form.`);
        }
        const el = elem;
        const frmdata = new FormData(el);
        const isValid = [...el.elements].every(el => el.matches(':valid'));
        // https://github.com/Microsoft/TypeScript/issues/30584
        const currentState = new URLSearchParams(frmdata).toString();
        const hasChanged = currentState !== lastState;
        if (isValid) {
            if (hasChanged) {
                lastState = currentState;
                await f(frmdata);
                console.log('foo complete with ' + currentState);
            }
            else {
                console.log('NO state change, skipping');
            }
        }
        else {
            console.log('Form not valid, skippin.');
        }
    };
};
/**
 * @description Manages the registering and notification of listeners for
 * non-interactivity with the supplied element.
 *
 * NOTE: only checks for *user* interaction, if making programmatic changes
 * you'll need to manually trigger the event or call your functions direcctly.
 */
class NonInteractiveCallbackManager {
    /**
     * @description Constructor for NonInteractiveCallbackManager
     *
     * @param [params] The destructured parameters object.
     * @param params.selector The CSS Selector, optional.
     * @param params.element The element to watch, must match selector if supplied.
     * @param params.eventDebounceTimeout Debounce threshold for the watched events
     * on the element, defaults to 500ms.
     * @param params.callbackDebounceTimeout The debounce threshold for calling the
     * registered callbacks when the user quits interacting with the element.
     * @param params.notifyOnFocusLoss Whether to immediately call the registered
     * callbacks if a DOM node outside the element gains focus. Defaults to false.
     * @param params.notifyOnMouseLeave Whether to immediately call the registered
     * callbacks if the user moves the mouse off the element.
     * @param interactiveEvents The list of DOM events watched for activity. Defaults
     * to click, mousemove, keydown, change.
     */
    constructor({ selector, element, eventDebounceTimeout = 500, callbackDebounceTimeout = 1000, notifyOnFocusLoss = false, notifyOnMouseLeave = true, interactiveEvents = [
        InteractiveEvents.MOUSEMOVE,
        InteractiveEvents.ANY_KEY,
        InteractiveEvents.CLICK,
        InteractiveEvents.CHANGE,
    ], }) {
        var _a, _b;
        // node and browser have different return types for setTimeout,
        // this sidesteps the issue.
        this.timeoutHandle = setTimeout(() => { }, 0);
        this.notify = this.notify.bind(this);
        this.focusHandler = this.focusHandler.bind(this);
        this.notifyOnFocusLoss = notifyOnFocusLoss;
        this.notifyOnMouseLeave = notifyOnMouseLeave;
        this.selector = selector || (element === null || element === void 0 ? void 0 : element.id) ? `#${element === null || element === void 0 ? void 0 : element.id}` : '';
        this.eventList = interactiveEvents;
        this.registeredCallbacks = [];
        if (!this.selector) {
            throw new Error('No selector or element id provided.');
        }
        this.element = element || assertExists(document.querySelector(this.selector));
        const debounced = debounce(callbackDebounceTimeout, this.notify);
        this.listener = debounce(eventDebounceTimeout, (evt) => {
            this.cancelPending();
            this.timeoutHandle = debounced();
        });
        this.eventList.forEach((evt) => {
            var _a;
            (_a = this.element) === null || _a === void 0 ? void 0 : _a.addEventListener(evt, this.listener);
        });
        if (notifyOnFocusLoss) {
            document.addEventListener('focus', this.focusHandler);
        }
        if (notifyOnMouseLeave) {
            (_a = this.element) === null || _a === void 0 ? void 0 : _a.addEventListener('mouseleave', this.notify);
        }
        // We'll watch the parentNode to see if the element we're listening
        // on is removed:
        const cleanup = (mutationList, observer) => {
            mutationList.forEach(record => {
                record.removedNodes.forEach(el => {
                    if (el === this.element) {
                        this.release();
                    }
                });
            });
        };
        this.observer = new MutationObserver(cleanup);
        this.observer.observe((_b = this.element) === null || _b === void 0 ? void 0 : _b.parentNode, { childList: true });
    }
    /**
     * @description Calls all the registered callbacks.
     *
     * @param evt The Event triggering the notification if relevant.
     * @returns this
     */
    notify(evt) {
        this.registeredCallbacks.forEach(cb => cb(evt));
        return this;
    }
    /**
     * @description Handles focus on the document, checks if the target is
     * contained by the element of interest.
     *
     * @param evt The focus event.
     * @returns void
     */
    focusHandler(evt) {
        var _a;
        if (!((_a = this.element) === null || _a === void 0 ? void 0 : _a.contains(evt.target))) {
            this.cancelPending();
            this.notify();
        }
    }
    ;
    /**
     * @description checks if the selector when called on the document
     * returns the same element as the supplied element.
     */
    checkMatching() {
        return !this.element
            || (document.querySelector(this.selector) === this.element);
    }
    /**
     * @description Registers a callback.
     *
     * @param f The callback to register to be called when the element is no
     * longer being interacted with by the user.
     * @returns this
     */
    register(f) {
        if (!this.registeredCallbacks.includes(f)) {
            this.registeredCallbacks.push(f);
        }
        return this;
    }
    /**
     * @description Immediately calls the registered callbacks, cancels the
     * pending debounced call.
     *
     * @param evt The triggering event if relevant.
     * @returns this
     */
    call(evt) {
        this.cancelPending();
        this.notify(evt);
        return this;
    }
    /**
     * @description Cancels the pending callback calls.
     *
     * @returns this
     */
    cancelPending() {
        clearTimeout(this.timeoutHandle);
        return this;
    }
    /**
     * @description Releases all resources associated with the callback
     * manager: all event listeners are removed, and the underlying
     * MutationObserver is disconnected.
     *
     * @returns this
     */
    release() {
        var _a;
        this.observer.disconnect();
        this.eventList.forEach(evt => { var _a; return (_a = this.element) === null || _a === void 0 ? void 0 : _a.removeEventListener(evt, this.listener); });
        if (this.notifyOnFocusLoss)
            document.removeEventListener('focus', this.focusHandler);
        if (this.notifyOnMouseLeave)
            (_a = this.element) === null || _a === void 0 ? void 0 : _a.removeEventListener('mouseleave', this.notify);
        return this;
    }
}
exports.NonInteractiveCallbackManager = NonInteractiveCallbackManager;
/**
 * @description Registers a callback to be triggered when the user is no longer
 * interacting with the supplied element.
 *
 * @param [params] The destructured parameters object.
 * @param params.selector The CSS Selector, optional.
 * @param params.element The element to watch, must match selector if supplied.
 * @param params.eventDebounceTimeout Debounce threshold for the watched events
 * on the element, defaults to 500ms.
 * @param params.callbackDebounceTimeout The debounce threshold for calling the
 * registered callbacks when the user quits interacting with the element.
 * @param params.notifyOnFocusLoss Whether to immediately call the registered
 * callbacks if a DOM node outside the element gains focus. Defaults to false.
 * @param params.notifyOnMouseLeave Whether to immediately call the registered
 * callbacks if the user moves the mouse off the element.
 * @param params.interactiveEvents The list of DOM events watched for activity. Defaults
 * to click, mousemove, keydown, change.
 * @param params.f The function to register as a callback.
 * @returns A NonInteractiveCallbackManager instance.
 */
function requestNonInteractiveCallback({ selector, element, eventDebounceTimeout, callbackDebounceTimeout, interactiveEvents, notifyOnFocusLoss, notifyOnMouseLeave, f, }) {
    return new NonInteractiveCallbackManager({
        selector,
        element,
        eventDebounceTimeout,
        callbackDebounceTimeout,
        interactiveEvents,
        notifyOnFocusLoss,
        notifyOnMouseLeave,
    }).register(f);
}
exports.requestNonInteractiveCallback = requestNonInteractiveCallback;
exports.default = requestNonInteractiveCallback;
//# sourceMappingURL=index.js.map