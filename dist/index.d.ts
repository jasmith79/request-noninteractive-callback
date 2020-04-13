/**
 * @description Monitors DOM elements for interactivity, fires registered
 * callbacks n milliseconds after interaction stops.
 *
 * @author jasmith79
 * @license MIT
 * @copyright 2020
 */
declare type OptionalEventHandler = (evt?: Event) => void;
export declare type RequestCallbackConstructorParams = {
    selector?: string;
    element?: HTMLElement;
    notifyOnMouseLeave: boolean;
    notifyOnFocusLoss: boolean;
    callbackDebounceTimeout: number;
    eventDebounceTimeout: number;
    interactiveEvents: InteractiveEvents[];
};
export declare type RequestNonInteractiveCallbackParams = RequestCallbackConstructorParams & {
    f: OptionalEventHandler;
};
export declare enum InteractiveEvents {
    MOUSEMOVE = "mousemove",
    ALPHANUM = "keypress",
    ANY_KEY = "keydown",
    CLICK = "click",
    CHANGE = "change"
}
/**
 * @description Provides a convenience wrapper for monitoring forms: it won't call the
 * wrapped callback if the form is invalid or hasn't changed since the last call.
 *
 * @param selector The CSS selector for the form.
 * @param f The callback to wrap and pass FormData to.
 * @returns A handler function to register.
 */
export declare const formHelper: (selector: string, f: (x: FormData) => any) => () => Promise<void>;
/**
 * @description Manages the registering and notification of listeners for
 * non-interactivity with the supplied element.
 *
 * NOTE: only checks for *user* interaction, if making programmatic changes
 * you'll need to manually trigger the event or call your functions direcctly.
 */
export declare class NonInteractiveCallbackManager {
    private selector;
    private element?;
    private eventList;
    private registeredCallbacks;
    private observer;
    private notifyOnFocusLoss;
    private notifyOnMouseLeave;
    private timeoutHandle;
    private listener;
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
    constructor({ selector, element, eventDebounceTimeout, callbackDebounceTimeout, notifyOnFocusLoss, notifyOnMouseLeave, interactiveEvents, }: RequestCallbackConstructorParams);
    /**
     * @description Calls all the registered callbacks.
     *
     * @param evt The Event triggering the notification if relevant.
     * @returns this
     */
    private notify;
    /**
     * @description Handles focus on the document, checks if the target is
     * contained by the element of interest.
     *
     * @param evt The focus event.
     * @returns void
     */
    private focusHandler;
    /**
     * @description checks if the selector when called on the document
     * returns the same element as the supplied element.
     */
    private checkMatching;
    /**
     * @description Registers a callback.
     *
     * @param f The callback to register to be called when the element is no
     * longer being interacted with by the user.
     * @returns this
     */
    register(f: OptionalEventHandler): this;
    /**
     * @description Immediately calls the registered callbacks, cancels the
     * pending debounced call.
     *
     * @param evt The triggering event if relevant.
     * @returns this
     */
    call(evt?: Event): this;
    /**
     * @description Cancels the pending callback calls.
     *
     * @returns this
     */
    cancelPending(): this;
    /**
     * @description Releases all resources associated with the callback
     * manager: all event listeners are removed, and the underlying
     * MutationObserver is disconnected.
     *
     * @returns this
     */
    release(): this;
}
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
export declare function requestNonInteractiveCallback({ selector, element, eventDebounceTimeout, callbackDebounceTimeout, interactiveEvents, notifyOnFocusLoss, notifyOnMouseLeave, f, }: RequestNonInteractiveCallbackParams): NonInteractiveCallbackManager;
export default requestNonInteractiveCallback;
