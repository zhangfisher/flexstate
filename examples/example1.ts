import {state, FlexStateMachine, FlexStateMap } from "../src"

class MyStateMachine extends FlexStateMachine{
    static states:FlexStateMap = {
        connect:{
            value:1,
        },
        connecting:{
            value:2,
        },
        connected:{
            value:3,
        }
    }

    @state()
    connect(){
        
    }
}


const fsm = new MyStateMachine()

fsm.connect()