// 错误
export class StateMachineError extends Error {}
export class NotRunningError extends StateMachineError{}
export class InvalidStateError extends StateMachineError { } 
export class FinalStateError extends StateMachineError { } 
export class TransitionError extends StateMachineError { }          
export class TransitioningError extends TransitionError { }        
export class CancelledTransitionError extends TransitionError { }
export class ResumeTransitionError extends TransitionError { }          
export class SideEffectTransitionError extends TransitionError{}
