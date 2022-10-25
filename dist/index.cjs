'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

require('reflect-metadata');
var flexDecorators = require('flex-decorators');
var liteEventEmitter = require('flex-decorators/liteEventEmitter');
var timeoutWrapper = require('flex-decorators/wrappers/timeout');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var timeoutWrapper__default = /*#__PURE__*/_interopDefaultLegacy(timeoutWrapper);

/**
*        
*   ---=== FlexState ===---
*   https://zhangfisher.github.com/flexstate
* 
*   简单易用的有限状态机实现
*
*/
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
async function delay(t = 100) {
  return new Promise((resolve) => {
    setTimeout(resolve, t);
  });
}
__name(delay, "delay");
function flexStringArgument(param, ...args) {
  let result = param;
  if (typeof param === "function") {
    result = param.call(...args);
  }
  if (typeof result != "string") {
    return result ? String(result) : result;
  }
  return result;
}
__name(flexStringArgument, "flexStringArgument");
function flexStringArrayArgument(param, ...args) {
  let results = typeof param === "function" ? param.call(...args) : param;
  results = Array.isArray(results) ? results : results ? typeof results === "string" ? results.split(",") : [
    results
  ] : [];
  return results.map((result) => typeof result === "function" ? result.call(...args) : typeof result == "string" ? result : String(result));
}
__name(flexStringArrayArgument, "flexStringArrayArgument");
function isClass(cls) {
  let result = false;
  if (typeof cls === "function" && cls.prototype) {
    try {
      cls.arguments && cls.caller;
    } catch (e) {
      result = true;
    }
  }
  return result;
}
__name(isClass, "isClass");
function isPlainObject(obj) {
  if (typeof obj !== "object" || obj === null)
    return false;
  var proto = Object.getPrototypeOf(obj);
  if (proto === null)
    return true;
  var baseProto = proto;
  while (Object.getPrototypeOf(baseProto) !== null) {
    baseProto = Object.getPrototypeOf(baseProto);
  }
  return proto === baseProto;
}
__name(isPlainObject, "isPlainObject");
function getClassStaticValue(instanceOrClass, fieldName, options = {}) {
  const opts = Object.assign({
    merge: 2,
    default: null
  }, options);
  let proto = isClass(instanceOrClass) ? instanceOrClass : instanceOrClass.constructor;
  let fieldValue = proto[fieldName];
  let valueType = isPlainObject(fieldValue) ? 0 : Array.isArray(fieldValue) ? 1 : 2;
  if (opts.merge === 0 || valueType === 2) {
    return fieldValue;
  }
  const defaultValue = valueType === 0 ? Object.assign({}, opts.default || {}) : opts.default || [];
  let valueList = [
    fieldValue
  ];
  while (proto) {
    proto = proto.__proto__;
    if (proto[fieldName]) {
      valueList.push(proto[fieldName]);
    } else {
      break;
    }
  }
  let mergedResults = fieldValue;
  if (valueType === 0) {
    mergedResults = valueList.reduce((result, item) => {
      if (isPlainObject(item)) {
        return opts.merge === 1 ? Object.assign({}, defaultValue, item, result) : Object.assign({}, defaultValue, item, result);
      } else {
        return result;
      }
    }, {});
  } else {
    mergedResults = valueList.reduce((result, item) => {
      if (Array.isArray(item)) {
        result.push(...item);
      }
      return result;
    }, []);
  }
  if (Array.isArray(mergedResults) && opts.merge === 2) {
    mergedResults = Array.from(new Set(mergedResults));
    if (isPlainObject(defaultValue)) {
      mergedResults.forEach((value, index) => {
        if (isPlainObject(value)) {
          mergedResults[index] = Object.assign({}, defaultValue, value);
        }
      });
    }
  }
  return mergedResults;
}
__name(getClassStaticValue, "getClassStaticValue");
var flexState = flexDecorators.createLiteDecorator("flexState");
var state = flexState;

// src/errors.ts
var StateMachineError = class extends Error {
};
__name(StateMachineError, "StateMachineError");
var NotRunningError = class extends StateMachineError {
};
__name(NotRunningError, "NotRunningError");
var InvalidStateError = class extends StateMachineError {
};
__name(InvalidStateError, "InvalidStateError");
var FinalStateError = class extends StateMachineError {
};
__name(FinalStateError, "FinalStateError");
var TransitionError = class extends StateMachineError {
};
__name(TransitionError, "TransitionError");
var TransitioningError = class extends TransitionError {
};
__name(TransitioningError, "TransitioningError");
var CancelledTransitionError = class extends TransitionError {
};
__name(CancelledTransitionError, "CancelledTransitionError");
var ResumeTransitionError = class extends TransitionError {
};
__name(ResumeTransitionError, "ResumeTransitionError");
var SideEffectTransitionError = class extends TransitionError {
};
__name(SideEffectTransitionError, "SideEffectTransitionError");

// src/consts.ts
var IDLE_STATE = {
  name: "IDLE",
  value: null,
  next: "*"
};
var ERROR_STATE = {
  name: "ERROR",
  final: true,
  value: Number.MAX_SAFE_INTEGER,
  next: "*"
};
var DefaultStateParams = {
  name: "",
  alias: void 0,
  value: 0,
  title: "",
  initial: false,
  final: false,
  next: [],
  enter: void 0,
  done: void 0,
  leave: void 0,
  resume: void 0
};
exports.FlexStateEvents = void 0;
(function(FlexStateEvents2) {
  FlexStateEvents2["START"] = "start";
  FlexStateEvents2["STOP"] = "stop";
  FlexStateEvents2["FINAL"] = "final";
  FlexStateEvents2["ERROR"] = "error";
})(exports.FlexStateEvents || (exports.FlexStateEvents = {}));
exports.FlexStateTransitionEvents = void 0;
(function(FlexStateTransitionEvents2) {
  FlexStateTransitionEvents2["BEGIN"] = "transition/begin";
  FlexStateTransitionEvents2["END"] = "transition/end";
  FlexStateTransitionEvents2["CANCEL"] = "transition/cancel";
  FlexStateTransitionEvents2["ERROR"] = "transition/error";
  FlexStateTransitionEvents2["FINAL"] = "transition/final";
})(exports.FlexStateTransitionEvents || (exports.FlexStateTransitionEvents = {}));
var CANCEL_TRANSITION = "cancelTransition";
var EnterStateEvent = /* @__PURE__ */ __name((name) => `${name}/enter`, "EnterStateEvent");
var LeaveStateEvent = /* @__PURE__ */ __name((name) => `${name}/leave`, "LeaveStateEvent");
var DoneStateEvent = /* @__PURE__ */ __name((name) => `${name}/done`, "DoneStateEvent");
var ResumeStateEvent = /* @__PURE__ */ __name((name) => `${name}/resume`, "ResumeStateEvent");
var _initialState, _finalStates, _currentState, _transitioning, _running, _name, _history, _actions, _conflictMethods;
var _FlexStateMachine = class extends liteEventEmitter.LiteEventEmitter {
  constructor(options = {}) {
    super(Object.assign({
      name: "",
      parent: null,
      context: null,
      autoStart: true,
      states: {},
      actions: {},
      injectActionMethod: true,
      throwActionError: false,
      injectStateValue: true,
      history: 0
    }, options));
    __publicField(this, "states", {});
    __privateAdd(this, _initialState, IDLE_STATE);
    __privateAdd(this, _finalStates, []);
    __privateAdd(this, _currentState, IDLE_STATE);
    __privateAdd(this, _transitioning, false);
    __privateAdd(this, _running, false);
    __privateAdd(this, _name, "");
    __privateAdd(this, _history, []);
    __privateAdd(this, _actions, {});
    __privateAdd(this, _conflictMethods, {});
    if (!this.options.context)
      this.options.context = this;
    __privateSet(this, _name, this.options.name || this.constructor.name);
    this._addStates();
    this._addTransitionListeners();
    this._registerActions();
    this._addParentStateListener();
    if (this.options.autoStart)
      this.start();
  }
  get name() {
    return __privateGet(this, _name);
  }
  get context() {
    return this.options.context || this;
  }
  get parent() {
    return this.options.parent;
  }
  get scope() {
    return this.options.scope;
  }
  get running() {
    return __privateGet(this, _running);
  }
  get actions() {
    return __privateGet(this, _actions);
  }
  get CURRENT() {
    return this.current.value;
  }
  get current() {
    return __privateGet(this, _currentState);
  }
  get initial() {
    return __privateGet(this, _initialState);
  }
  get transitioning() {
    return __privateGet(this, _transitioning);
  }
  get history() {
    return __privateGet(this, _history);
  }
  get options() {
    return super.options;
  }
  _addParentStateListener() {
    var _a;
    if (this.parent) {
      this.parent.on("done", async () => await this.start());
      this.parent.on("leave", async () => await this._stop());
      (_a = this.scope) == null ? void 0 : _a.on(`ERROR/done`, async () => await this._stop());
    }
  }
  _addStates() {
    const staticStates = this.parent ? {} : getClassStaticValue(this.context, "states");
    const definedStates = Object.assign({}, staticStates, this.options.states);
    if (Object.keys(definedStates).length == 0)
      throw new StateMachineError("\u672A\u63D0\u4F9B\u72B6\u6001\u673A\u5B9A\u4E49");
    for (let [name, state2] of Object.entries(definedStates)) {
      state2.name = name;
      let addedState = this._add(state2);
      if (this.options.injectStateValue) {
        this.context[name.toUpperCase()] = addedState.value;
      }
      if (addedState.initial)
        __privateSet(this, _initialState, addedState);
      if (addedState.final)
        __privateGet(this, _finalStates).push(addedState.name);
    }
    if (!this.isValid(__privateGet(this, _initialState))) {
      __privateSet(this, _initialState, this.states[Object.keys(this.states)[0]]);
    }
    this.states["ERROR"] = Object.assign({}, ERROR_STATE);
    if (this.options.injectStateValue)
      this.context["ERROR"] = ERROR_STATE.value;
    this.states["IDLE"] = Object.assign({}, IDLE_STATE);
    if (this.options.injectStateValue)
      this.context["IDLE"] = IDLE_STATE.value;
  }
  _emitStateMachineEvent(event, ...args) {
    try {
      this.emit(event, ...args);
    } catch (e) {
    }
  }
  async start() {
    if (__privateGet(this, _running))
      return;
    __privateSet(this, _running, true);
    this._emitStateMachineEvent(exports.FlexStateEvents.START);
    try {
      return await this.transition(__privateGet(this, _initialState));
    } catch (e) {
      this._stop(e);
    }
  }
  _stop(e) {
    if (__privateGet(this, _transitioning))
      this.emit(CANCEL_TRANSITION);
    __privateSet(this, _currentState, IDLE_STATE);
    __privateSet(this, _running, false);
    this._emitStateMachineEvent(exports.FlexStateEvents.STOP, e);
  }
  async stop() {
    this._assertRunning();
    this._stop();
  }
  async reset() {
    await this.stop();
    await this.start();
  }
  _addTransitionListeners() {
    const context = this.context;
    const eventMap = [
      [
        exports.FlexStateTransitionEvents.BEGIN,
        "onTransitionBegin"
      ],
      [
        exports.FlexStateTransitionEvents.END,
        "onTransitionEnd"
      ],
      [
        exports.FlexStateTransitionEvents.CANCEL,
        "onTransitionCancel"
      ],
      [
        exports.FlexStateTransitionEvents.ERROR,
        "onTransitionError"
      ]
    ];
    if (context) {
      eventMap.forEach(([event, method]) => {
        if (typeof (context == null ? void 0 : context[method]) === "function") {
          this.on(event, context[method].bind(context));
        }
      });
      if (typeof context.onTransition === "function") {
        Object.values(exports.FlexStateTransitionEvents).forEach((event) => this.on(event, context.onTransition.bind(context)));
      }
    }
    eventMap.forEach(([event, method]) => {
      if (typeof this.options[method] === "function") {
        this.on(event, this.options[method].bind(context));
      }
    });
    if (typeof this.options.onTransition === "function") {
      Object.values(exports.FlexStateTransitionEvents).forEach((event) => this.on(event, this.options.onTransition.bind(context)));
    }
  }
  _normalizeState(state2) {
    let normaizedState = Object.assign({}, DefaultStateParams, state2);
    if (!normaizedState.name)
      throw new StateMachineError("\u72B6\u6001\u5FC5\u987B\u6307\u5B9A\u6709\u6548\u7684\u540D\u79F0");
    if (typeof normaizedState.value != "number")
      throw new StateMachineError("\u72B6\u6001\u5FC5\u987B\u6307\u5B9A\u6709\u6548\u7684\u72B6\u6001\u503C");
    if (typeof normaizedState.next == "string") {
      normaizedState.next = [
        normaizedState.next
      ];
    } else if (state2.next === void 0) {
      normaizedState.next = [];
    } else if (!Array.isArray(normaizedState.next) && typeof normaizedState.next != "function") {
      normaizedState.next = [];
    }
    if (typeof normaizedState.next != "function")
      normaizedState.next.push("ERROR");
    return normaizedState;
  }
  _add(state2) {
    const context = this.context;
    let finalState = this._normalizeState(state2);
    let stateName = finalState.name;
    let stateAliasName = finalState.alias;
    const hookEvents = [
      "Enter",
      "Leave",
      "Done",
      "Resume"
    ];
    hookEvents.forEach((event) => {
      let method = finalState[event.toLowerCase()];
      if (typeof method == "function") {
        this.on(`${stateName}/${event.toLowerCase()}`, this._makeStateHookCallback(method).bind(context));
      }
    });
    let firstUpperCaseStateName = `${stateName.slice(0, 1).toUpperCase()}${stateName.substring(1).toLowerCase()}`;
    let firstUpperCaseStateAliasName = stateAliasName ? `${stateAliasName.slice(0, 1).toUpperCase()}${stateAliasName.substring(1).toLowerCase()}` : void 0;
    hookEvents.forEach((event) => {
      const methodName2 = `on${firstUpperCaseStateAliasName || firstUpperCaseStateName}${event}`;
      if (typeof context[methodName2] === "function") {
        this.on(`${stateName}/${event.toLowerCase()}`, this._makeStateHookCallback(context[methodName2]).bind(context));
      }
    });
    const methodName = `on${firstUpperCaseStateAliasName || firstUpperCaseStateName}`;
    if (typeof context[methodName] === "function") {
      this.on(`${stateName}/done`, this._makeStateHookCallback(context[methodName]).bind(context));
    }
    this[`waitFor${firstUpperCaseStateName}`] = async () => await this.waitForState(stateName);
    if (this.options.injectStateValue) {
      this.context[stateName.toUpperCase()] == finalState.value;
    }
    if (isPlainObject(finalState.scope) && Object.keys(finalState.scope).length > 0) {
      this._createStateScope(finalState, finalState.scope);
    }
    finalState.createScope = (options) => this._createStateScope(finalState, options);
    finalState.on = (event, cb) => this.on(`${stateName}/${event}`, cb);
    finalState.off = (event, cb) => this.off(`${stateName}/${event}`, cb);
    this.states[stateName] = finalState;
    return this.states[stateName];
  }
  _createStateScope(state2, options) {
    if (state2.scope)
      throw new StateMachineError("\u5B50\u72B6\u6001\u5DF2\u7ECF\u5B9A\u4E49");
    state2.scope = new _FlexStateMachine({
      ...options,
      scope: this,
      parent: state2,
      context: this.context,
      autoStart: false
    });
    return state2.scope;
  }
  getState(param, ...args) {
    let resultState;
    resultState = typeof param === "function" ? param.call(this, ...args) : param;
    if (typeof resultState === "string" && resultState in this.states) {
      return this.states[resultState];
    } else if (typeof resultState === "number") {
      for (let state2 of Object.values(this.states)) {
        if (state2.value === resultState)
          return state2;
      }
    } else if (isPlainObject(resultState) && resultState.name in this.states) {
      return this.states[resultState.name];
    }
    throw new InvalidStateError();
  }
  add(state2) {
    let finalState = Object.assign({}, DefaultStateParams, state2);
    if (!finalState.name || !finalState.value)
      throw new StateMachineError("\u72B6\u6001\u5FC5\u987B\u6307\u5B9A\u6709\u6548\u7684name\u548Cvalue\u53C2\u6570");
    if (finalState.name in this.states || Object.values(this.states).findIndex((s) => s.value === finalState.value) != -1)
      throw new StateMachineError(`\u72B6\u6001<{${finalState.name}}>\u5DF2\u7ECF\u5B58\u5728`);
    return this._add(finalState);
  }
  remove(name) {
    if (name in this.states) {
      this.offAll(`${name}/enter`);
      this.offAll(`${name}/leave`);
      this.offAll(`${name}/done`);
      this.offAll(`${name}/resume`);
      delete this.states[name];
    }
  }
  isValid(state2) {
    if (!state2)
      return false;
    if (typeof state2 === "string") {
      return state2 in this.states;
    } else if (typeof state2 === "number") {
      return Object.values(this.states).some((s) => s.value === state2);
    } else if (isPlainObject(state2)) {
      return Object.values(this.states).some((s) => s.value === state2.value && s.name === state2.name);
    } else {
      return false;
    }
  }
  isCurrent(state2) {
    if (typeof state2 == "string") {
      return this.current.name === state2;
    } else if (isPlainObject(state2)) {
      return state2.name === this.current.name;
    } else if (typeof state2 === "function") {
      return state2() === this.current.name;
    } else {
      return false;
    }
  }
  isFinal() {
    return this.current && this.current.final;
  }
  _getDecoratoredActions() {
    let decoratedActions = flexDecorators.getDecorators(this.context, "flexState");
    Object.entries(decoratedActions).forEach(([methodName, [action]]) => {
      action.execute = this.context[methodName];
      decoratedActions[methodName] = action;
    });
    return decoratedActions;
  }
  _registerActions() {
    __privateSet(this, _actions, {});
    this.parent ? {} : getClassStaticValue(this.context, "actions");
    let decoratedActions = this._getDecoratoredActions();
    let actions = Object.assign({}, decoratedActions, this.options.actions);
    for (let [name, action] of Object.entries(actions)) {
      try {
        if (Array.isArray(action))
          action = action[0];
        if (!action.name)
          action.name = name;
        this.register(action);
      } catch (e) {
        console.error("\u6CE8\u518C\u5F02\u6B65\u72B6\u6001\u673A\u52A8\u4F5C{}\u51FA\u9519:{}", [
          name,
          e.message
        ]);
      }
    }
  }
  _normalizeAction(action) {
    const name = action.name;
    if (typeof action.execute != "function") {
      throw new StateMachineError(`\u672A\u5B9A\u4E49\u72B6\u6001\u52A8\u4F5C\u51FD\u6570${name}`);
    }
    if (name && name in __privateGet(this, _actions)) {
      throw new StateMachineError(`\u72B6\u6001\u673A\u52A8\u4F5C${name}\u5DF2\u5B58\u5728,\u4E0D\u80FD\u91CD\u590D\u6CE8\u518C`);
    }
    [
      "pending",
      "resolved",
      "rejected",
      "finally"
    ].forEach((param) => {
      if (typeof action[param] == "string") {
        if (action[param] && !this.isValid(action[param])) {
          throw new StateMachineError(`\u52A8\u4F5C\u53C2\u6570${param}\u53EA\u80FD\u662F\u6709\u6548\u7684\u72B6\u6001\u540D\u79F0\u6216\u8005\u51FD\u6570`);
        }
      }
    });
    action.when = flexStringArrayArgument(action.when, this.context, this.current);
    if (typeof action.pending == "string" && Array.isArray(action.when) && action.when.length > 0) {
      if (action.when.some((stateName) => stateName === action.pending))
        return true;
      if (!action.when.some((stateName) => {
        const nextStates = this.getState(stateName).next;
        return Array.isArray(nextStates) ? nextStates.includes(action.pending) : true;
      })) {
        throw new StateMachineError(`\u72B6\u6001\u52A8\u4F5C<${name}>\u7684pending\u53C2\u6570\u65E0\u6548,\u65E0\u6CD5\u4ECE<{${action.when.join()}}>\u5207\u6362\u5230<${action.pending}>`);
      }
    }
    let fromStates = this.isValid(action.pending) && typeof action.pending !== "function" ? [
      action.pending
    ] : action.when;
    const endStates = [
      "resolved",
      "rejected",
      "finally"
    ];
    endStates.forEach((param) => {
      if (typeof action[param] == "string") {
        if (Array.isArray(fromStates) && !fromStates.some((stateName) => {
          const nextStates = this.getState(stateName).next;
          return Array.isArray(nextStates) ? nextStates.includes(action[param]) : true;
        })) {
          throw new StateMachineError(`\u72B6\u6001\u52A8\u4F5C<${name}>\u7684<${param}>\u53C2\u6570\u65E0\u6548,\u65E0\u6CD5\u4ECE${fromStates.join()}\u5207\u6362\u5230${action[param]}`);
        }
      }
    });
  }
  _createActionExecutor(action) {
    return async function(...args) {
      this._assertRunning();
      if (this.isFinal())
        throw new FinalStateError();
      let result, oldStateName, finalState, pendingState, hasError = false, isPending = false;
      try {
        oldStateName = this.current.name;
        let whenState = flexStringArrayArgument(action.when, this.context, oldStateName);
        if (oldStateName !== IDLE_STATE.name && whenState.length > 0 && !whenState.includes(oldStateName)) {
          throw new TransitionError(`\u52A8\u4F5C<${action.name}>\u53EA\u80FD\u5728\u72B6\u6001<${this.current.name}>\u4E0B\u624D\u5141\u8BB8\u6267\u884C,\u5F53\u524D\u72B6\u6001\u662F<${whenState}>`);
        }
        pendingState = flexStringArgument(action.pending, this.context, result);
        if (this.isValid(pendingState) && pendingState !== this.current.name) {
          await this.transition(pendingState, ...args);
          isPending = true;
        }
        result = await action.execute.apply(this.context, args);
        finalState = flexStringArgument(action.resolved, this.context, result);
      } catch (e) {
        finalState = flexStringArgument(action.rejected, this.context, e);
        hasError = e;
        throw e;
      } finally {
        finalState = flexStringArgument(action.finally, this.context, hasError || result) || finalState;
        if (this.isValid(finalState)) {
          try {
            await this.transition(finalState, result);
          } catch (e1) {
            await this._transitionToError({
              to: finalState.name,
              error: e1
            });
          }
        } else {
          if (isPending && hasError) {
            __privateSet(this, _currentState, this.getState(oldStateName));
          }
        }
      }
      return result;
    };
  }
  register(action) {
    this._normalizeAction(action);
    if (!action.name)
      throw new TypeError("\u9700\u8981\u4E3A\u52A8\u4F5C\u6307\u5B9A\u4E00\u4E2A\u540D\u79F0");
    const fn = this._createActionExecutor(action);
    __privateGet(this, _actions)[action.name] = fn.bind(this.context);
    if (this.options.injectActionMethod) {
      const actionName = action.alias && action.alias.length > 0 ? action.alias : action.name;
      if (actionName in this.context) {
        if (!__privateGet(this, _conflictMethods))
          __privateSet(this, _conflictMethods, [
            this.context[actionName]
          ]);
        __privateGet(this, _conflictMethods)[actionName] = this.context[actionName];
        console.warn("\u5F02\u6B65\u72B6\u6001\u673A\u6CE8\u5165\u7684\u52A8\u4F5C\u5728\u5B9E\u4F8B\u4E0A\u5DF2\u7ECF\u5B58\u5728\u540C\u540D\u65B9\u6CD5");
      }
      this.context[actionName] = (...args) => {
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            try {
              resolve(await this.execute(actionName, ...args));
            } catch (e) {
              if (this.options.throwActionError)
                reject(e);
            }
          }, 0);
        });
      };
    }
  }
  unregister(name) {
    if (name in __privateGet(this, _actions)) {
      if (__privateGet(this, _conflictMethods) && name in __privateGet(this, _conflictMethods)) {
        this[name] = __privateGet(this, _conflictMethods)[name];
      }
      delete __privateGet(this, _actions)[name];
      delete this.context[name];
    }
  }
  async cancel() {
    this.emit("transition/cancel");
  }
  async _transitionToError(params) {
    __privateSet(this, _currentState, this.states.ERROR);
    await this._emitStateHookCallback(DoneStateEvent("ERROR"), params);
  }
  async transition(next, params = {}) {
    this._assertRunning();
    if (this.transitioning)
      throw new TransitioningError();
    if (this.isFinal())
      throw new FinalStateError();
    if (!this.isValid(next))
      throw new InvalidStateError();
    __privateSet(this, _transitioning, true);
    const nextState = this.getState(next);
    if (this.current && nextState.name == this.current.name)
      return;
    let isDone = false;
    const beginTime = Date.now();
    const currentState = this.current;
    const transitionInfo = {
      params,
      from: currentState.name,
      to: nextState.name
    };
    try {
      if (!this.canTransitionTo(nextState.name)) {
        this._safeEmitEvent(exports.FlexStateTransitionEvents.CANCEL, {
          event: "CANCEL",
          ...transitionInfo
        });
        throw new TransitionError(`\u4E0D\u5141\u8BB8\u4ECE\u72B6\u6001<{${currentState.name}}>\u8F6C\u6362\u5230\u72B6\u6001<{${nextState.name}}>`);
      }
      this._safeEmitEvent(exports.FlexStateTransitionEvents.BEGIN, {
        event: "BEGIN",
        ...transitionInfo
      });
      if (currentState.name != IDLE_STATE.name) {
        const leaveResult = await this._emitStateHookCallback(LeaveStateEvent(currentState.name), {
          ...transitionInfo
        });
        if (leaveResult.error) {
          this._safeEmitEvent(exports.FlexStateTransitionEvents.ERROR, {
            error: leaveResult.error,
            ...transitionInfo
          });
          if (leaveResult.error instanceof SideEffectTransitionError) {
            await this._transitionToError({
              ...transitionInfo,
              error: leaveResult.error
            });
          }
          throw leaveResult.error;
        }
      }
      const enterResult = await this._emitStateHookCallback(EnterStateEvent(nextState.name), {
        ...transitionInfo
      });
      if (enterResult.error) {
        this._safeEmitEvent(exports.FlexStateTransitionEvents.ERROR, {
          event: "ERROR",
          error: enterResult.error,
          ...transitionInfo
        });
        if (enterResult.error instanceof SideEffectTransitionError) {
          await this._transitionToError({
            ...transitionInfo,
            error: enterResult.error
          });
        } else {
          const resumeResult = await this._emitStateHookCallback(ResumeStateEvent(currentState.name), {
            ...transitionInfo,
            error: enterResult.error
          });
          if (resumeResult.error) {
            await this._transitionToError({
              ...transitionInfo,
              error: resumeResult.error
            });
          }
        }
        throw enterResult.error;
      } else {
        __privateSet(this, _currentState, this.states[nextState.name]);
        isDone = true;
      }
    } catch (e) {
      this._safeEmitEvent(exports.FlexStateTransitionEvents.ERROR, {
        event: "ERROR",
        error: e,
        ...transitionInfo
      });
      throw new TransitionError(e.message);
    } finally {
      __privateSet(this, _transitioning, false);
    }
    if (isDone) {
      this._addHistory(this.current.name);
      this._safeEmitEvent(DoneStateEvent(this.current.name), transitionInfo);
      this._safeEmitEvent(exports.FlexStateTransitionEvents.END, {
        event: "END",
        timeConsuming: Date.now() - beginTime,
        ...transitionInfo
      });
      if (this.isFinal())
        this._safeEmitEvent(exports.FlexStateEvents.FINAL);
    }
    return this;
  }
  _addHistory(stateName) {
    if (this.options.history > 0) {
      this.history.push([
        Date.now(),
        stateName
      ]);
      if (this.history.length > this.options.history)
        this.history.splice(0, 1);
    }
  }
  _safeEmitEvent(event, ...args) {
    try {
      this.emit(event, ...args);
    } catch (e) {
    }
  }
  async _emitStateHookCallback(event, params) {
    let eventResults, returnValue = {};
    try {
      eventResults = await this.emitAsync(event, params);
      if (eventResults.some((r) => r === false)) {
        returnValue = {
          error: new CancelledTransitionError()
        };
      } else {
        let errorIndex = eventResults.findIndex((r) => r instanceof Error);
        if (errorIndex != -1) {
          returnValue = {
            error: eventResults[errorIndex]
          };
        }
      }
      returnValue.result = eventResults;
    } catch (e) {
      returnValue = {
        error: e
      };
    }
    return returnValue;
  }
  canTransitionTo() {
    let fromState, toState;
    if (arguments.length === 1) {
      fromState = this.current;
      toState = arguments[0];
    } else if (arguments.length === 2) {
      fromState = this.getState(arguments[0]);
      toState = arguments[1];
    } else {
      throw new TypeError("Error Param");
    }
    toState = this.getState(toState);
    if (fromState.name == IDLE_STATE.name && toState.name != this.initial.name) {
      return false;
    }
    if (fromState.final) {
      return false;
    }
    if (fromState && fromState.next) {
      if (fromState.next === "*")
        return true;
      let nextStates = fromState.next;
      if (typeof fromState.next == "function") {
        nextStates = fromState.next.call(this);
      }
      nextStates = Array.isArray(nextStates) ? nextStates : typeof nextStates == "string" ? [
        nextStates
      ] : [];
      if (!nextStates.includes("ERROR"))
        nextStates.push("ERROR");
      return nextStates.some((s) => s === "*") || nextStates.length === 1 && typeof nextStates[0] == "string" && nextStates[0] === "ERROR" ? true : nextStates.includes(toState.name);
    } else {
      return true;
    }
  }
  _makeStateHookCallback(fn) {
    let [hookFn, runOptions] = Array.isArray(fn) ? fn : [
      fn,
      {
        timeout: 0
      }
    ];
    if (!runOptions.timeout)
      runOptions.timeout = 0;
    let wrapperFn = timeoutWrapper__default["default"](hookFn, {
      value: runOptions.timeout
    });
    return (args) => new Promise(async (resolve, reject) => {
      const cancel = /* @__PURE__ */ __name(() => reject(new CancelledTransitionError()), "cancel");
      this.once(exports.FlexStateTransitionEvents.CANCEL, cancel);
      let callCount = 1, retryInterval = 0, hasError;
      args.retry = (ms = 0) => {
        retryInterval = ms;
        callCount++;
        throw new Error();
      };
      args.retryCount = 0;
      while (callCount > 0) {
        callCount--;
        try {
          let result = await wrapperFn.call(this.context, args);
          resolve(result);
        } catch (e) {
          hasError = e;
        } finally {
          args.retryCount++;
        }
        if (callCount > 0 && retryInterval > 0)
          await delay(retryInterval);
      }
      this.off(exports.FlexStateTransitionEvents.CANCEL, cancel);
      if (hasError)
        reject(hasError);
    });
  }
  async execute(name, ...args) {
    this._assertRunning();
    return await __privateGet(this, _actions)[name].call(this, ...args);
  }
  _assertRunning() {
    if (!__privateGet(this, _running))
      throw new NotRunningError();
  }
  async waitForState(state2) {
    const forState = this.getState(state2);
    if (this.current.name === forState.name || this.current.value === forState.value)
      return;
    return await this.wait(`${forState.name}/done`);
  }
  async waitForInitial() {
    return this.waitForState(this.initial);
  }
};
var FlexStateMachine = _FlexStateMachine;
__name(FlexStateMachine, "FlexStateMachine");
_initialState = new WeakMap();
_finalStates = new WeakMap();
_currentState = new WeakMap();
_transitioning = new WeakMap();
_running = new WeakMap();
_name = new WeakMap();
_history = new WeakMap();
_actions = new WeakMap();
_conflictMethods = new WeakMap();
__publicField(FlexStateMachine, "states", {});
__publicField(FlexStateMachine, "actions", {});

exports.CancelledTransitionError = CancelledTransitionError;
exports.DefaultStateParams = DefaultStateParams;
exports.ERROR_STATE = ERROR_STATE;
exports.FinalStateError = FinalStateError;
exports.FlexStateMachine = FlexStateMachine;
exports.IDLE_STATE = IDLE_STATE;
exports.InvalidStateError = InvalidStateError;
exports.NotRunningError = NotRunningError;
exports.ResumeTransitionError = ResumeTransitionError;
exports.SideEffectTransitionError = SideEffectTransitionError;
exports.StateMachineError = StateMachineError;
exports.TransitionError = TransitionError;
exports.TransitioningError = TransitioningError;
exports.delay = delay;
exports.flexState = flexState;
exports.flexStringArgument = flexStringArgument;
exports.flexStringArrayArgument = flexStringArrayArgument;
exports.getClassStaticValue = getClassStaticValue;
exports.isClass = isClass;
exports.isPlainObject = isPlainObject;
exports.state = state;
//# sourceMappingURL=index.cjs.map