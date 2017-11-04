/// <reference path="../typings/globals/underscore/index.d.ts"/>
const ADDRESS_RANGE = 32;
const PAGE_RANGE = 12;
const PAGE_SIZE = Math.pow(2, PAGE_RANGE);
const MEMORY_BLOCK_BITS = 8;
//const PAGE_OFFSETS = Math.floor(PAGE_SIZE / MEMORY_BLOCK_BITS);
const PHYSICAL_MEMORY_BITS = 2048; //8192;
const NO_WAIT = true;
function padBinary(value, width) {
    let str = value.toString(2);
    if (width && str.length < width) {
        return "0".repeat(width - str.length) + str;
    }
    return str;
}
function binaryAdd(a, b) {
    var res = [];
    let carry = false, len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) {
        let a1 = a[i] === "1", b1 = b[i] === "1";
        if (a1) {
            if (b1) {
                if (carry) {
                    res[i] = "1";
                }
                else {
                    res[i] = "0";
                }
                carry = true;
            }
            else {
                if (carry) {
                    res[i] = "0";
                    carry = true;
                }
                else {
                    res[i] = "1";
                }
            }
        }
        else if (b1) {
            if (carry) {
                res[i] = "0";
                carry = true;
            }
            else {
                res[i] = "1";
            }
        }
        else if (carry) {
            res[i] = "1";
            carry = false;
        }
        else {
            res[i] = "0";
        }
    }
    if (carry) {
        res[len] = "1";
    }
    return res;
}
function binaryMultiply(s, t) {
    if (s === 0 || t === 0) {
        return { HI: 0, LO: 0 };
    }
    if (s < t) {
        // make s the bigger number
        let temp = t;
        t = s;
        s = temp;
    }
    const s2 = s.toString(2), t2 = t.toString(2).split("").reverse();
    let accumBase = s2.split("").reverse(), //TODO use map to convert to boolean 
    accum = (new Array(accumBase.length)).fill("0");
    t2.forEach(function (ti) {
        if (ti === "0") {
            accumBase.unshift("0");
            return;
        }
        accum = binaryAdd(accum, accumBase);
        accumBase.unshift("0");
    });
    const result = accum.reverse().join("");
    if (accum.length > 32) {
        return {
            HI: parseInt(result.substring(0, result.length - 32), 2),
            LO: parseInt(result.substring(result.length - 32), 2)
        };
    }
    return {
        HI: 0,
        LO: parseInt(result, 2)
    };
}
function test() {
    let time1, time2, totalTime = 0, cnt = 100000;
    for (let i = 0; i < cnt; i++) {
        let a = Math.floor(Math.random() * Math.pow(2, 15)), b = Math.floor(Math.random() * Math.pow(2, 15)), ans1 = a * b;
        time1 = self.performance.now();
        let ans2 = binaryMultiply(a, b);
        time2 = self.performance.now();
        totalTime = time2 - time1;
        if (ans1 !== ans2.LO) {
            console.log("incorrect!!!", a, b);
            break;
        }
    }
    console.log("avg = " + (totalTime / cnt));
}
function applyMixins(derivedCtor, baseCtors) {
    baseCtors.forEach(baseCtor => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach(name => {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        });
    });
}
class EventDispatcher {
    //_id: number = 0;
    constructor() {
        this._listeners = {};
        this._disabled = false;
    }
    on(event, fn, one) {
        if (!_.isArray(event)) {
            event = [event];
        }
        for (let e of event) {
            let listeners = this._listeners[e];
            if (listeners === undefined) {
                listeners = [];
                this._listeners[e] = listeners;
            }
            //fn.id = ++this._id;
            listeners.push({ one: (one === true ? true : false), fn: fn });
        }
    }
    trigger(event, data) {
        if (EventDispatcher.GLOBAL_DISABLED)
            return;
        let listeners = this._listeners[event];
        if (listeners !== undefined) {
            listeners.forEach(l => l.fn(data));
            this._listeners[event] = listeners.filter(l => l.one === false);
        }
    }
    off(event, fn) {
        if (event === undefined) {
            this._listeners = {};
        }
        else if (this._listeners[event] !== undefined) {
            if (fn !== undefined) {
                this._listeners[event] = this._listeners[event].filter(el => el.fn !== fn);
            }
            else {
                delete this._listeners[event];
            }
        }
    }
}
EventDispatcher.GLOBAL_DISABLED = false;
class FunctionQueue {
    constructor(context) {
        this.context = context;
        this._queue = [];
        this._wait = true;
    }
    wait() {
        this._wait = true;
    }
    noWait() {
        this._wait = false;
    }
    pulse() {
        if (this._queue.length !== 0) {
            let fn = this._queue.shift();
            fn.call(this.context);
        }
    }
    queue(fn) {
        if (!this._wait) {
            fn.call(this.context);
            return;
        }
        //console.log("queued", fn.toString().substring(0, fn.toString().indexOf('(')) + "()");
        this._queue.push(fn);
    }
    front(fn) {
        if (!this._wait) {
            fn.call(this.context);
            return;
        }
        this._queue.unshift(fn);
    }
    empty() {
        this._queue = [];
    }
}
class RTOS extends EventDispatcher {
    constructor() {
        super();
        this.physicalMemory = new PhysicalMemory();
        this.memoryController = new MemoryController(this.physicalMemory); //, this.virtualMemory);
        this.cpu = new CPU(this.memoryController);
        this.scheduler = new Scheduler(this);
        //this.cpu.programCounter = 10;
    }
    startProgram(pc) {
        if (!isNaN(pc)) {
            this.cpu.writeRegister("PC", pc);
        }
        this.cpu.signalStatus(CpuStatus.RUNNING);
        this.cpu.functionQueue.queue(this.cpu.fetch);
    }
    _loadKernal() {
        // TODO fix memory space
        this.saveContextPC = 0;
        //let end = this._loadInstructions(kernal.saveContext);//, this.saveContextPC);
    }
    _loadKernalInstructions(instructions) {
        const memory = this.physicalMemory.blocks;
        let index = RTOS.KERNAL_CODE_START;
        this.cpu.clearCache(true);
        let delta = [];
        instructions += "\nsll 0 0 0"; //add program end
        instructions.split("\n")
            .map(e => { const i = e.indexOf("#"); return s.trim(i === -1 ? e : e.substring(0, i)); })
            .forEach(function (elt) {
            const instruction = Assembler.assemble(elt);
            console.log("instruction", instruction, padBinary(instruction, 32), elt);
            memory[index] = (instruction >> 24) & 255;
            delta.push({ index: index, value: memory[index] });
            index++;
            memory[index] = (instruction >> 16) & 255;
            delta.push({ index: index, value: memory[index] });
            index++;
            memory[index] = (instruction >> 8) & 255;
            delta.push({ index: index, value: memory[index] });
            index++;
            memory[index] = instruction & 255;
            delta.push({ index: index, value: memory[index] });
            index++;
        }, this);
        this.trigger("initMemory", delta);
        return RTOS.KERNAL_CODE_START;
    }
    loadInstructionsDelta(instructions, location) {
        let memory = this.physicalMemory.blocks;
        let delta = [];
        let start = location || RTOS.APP_MEMORY_START;
        this.cpu.clearCache(true);
        instructions.split("\n")
            .map(e => { const i = e.indexOf("#"); return s.trim(i === -1 ? e : e.substring(0, i)); })
            .forEach(function (elt) {
            const instruction = Assembler.assemble(elt);
            console.log("instruction", instruction, padBinary(instruction, 32), elt);
            memory[start] = (instruction >> 24) & 255;
            delta.push({ index: start, value: memory[start] });
            start++;
            memory[start] = (instruction >> 16) & 255;
            delta.push({ index: start, value: memory[start] });
            start++;
            memory[start] = (instruction >> 8) & 255;
            delta.push({ index: start, value: memory[start] });
            start++;
            memory[start] = instruction & 255;
            delta.push({ index: start, value: memory[start] });
            start++;
        }, this);
        return delta;
    }
}
//static CONTEXT_SWITCH_PC = RTOS.TCB_SIZE_TOTAL;
RTOS.KERNAL_MEMORY_START = 512;
RTOS.KERNAL_CODE_START = 576;
RTOS.APP_MEMORY_START = 1536;
class Scheduler extends EventDispatcher {
    constructor(rtos) {
        super();
        this.rtos = rtos;
        this.head = undefined;
        this.tail = undefined;
        this._taskId = 0;
        this.cnt = 0;
        this.lastCnt = 0;
    }
    _nextTaskId() {
        return this._taskId = (this._taskId === 255 ? 1 : this._taskId + 1);
    }
    interrupt() {
        const rtos = this.rtos, cpu = rtos.cpu;
        cpu.interrupt().then(_.bind(function () {
            console.log("interrupt promise");
            this.trigger("interrupt");
            this._switchToNextContext();
        }, this));
    }
    _switchToNextContext() {
        console.log("_switchToNextContext");
        const currentTCBAddress = this.rtos.cpu.registers[26].value, nextTCBAddress = this.rtos.physicalMemory.directReadWord(currentTCBAddress + 4), nextPC = this.rtos.physicalMemory.directReadWord(nextTCBAddress + 116);
        this.cnt += 1;
        const listener = _.bind(function contextSwitchTrigger(matchPC, cnt, data) {
            if (data.register._address === 29 && data.register.value === matchPC) {
                // loaded TCB was started
                console.log("trigger context switch " + cnt);
                this.rtos.cpu.off("writeRegister", listener);
                if (this.lastCnt >= cnt)
                    return;
                this.lastCnt = cnt;
                this.trigger("contextSwitched");
            }
        }, this, nextPC, this.cnt);
        this.rtos.cpu.on("writeRegister", listener);
        // save current context
        let instructions = kernal.saveCurrentContext();
        // update 26 with next TCB address
        instructions += "\n" + kernal.loadNextTCBAddress();
        // load next TCB context from register 26
        instructions += "\n" + kernal.loadTCB();
        const start = this.rtos._loadKernalInstructions(instructions);
        this.rtos.startProgram(start);
    }
    /**
     * CPU context must be saved prior
     * when allocating a new TCB, we must find the current tail TCB and update it to point to this TCB.
     * this is done by pulling the reference from the kernal RAM variable
     * @param PC
     */
    allocateNewTCB(PC) {
        //find TCB location
        let instructions = kernal.findEmptyTCB();
        //initial TCB
        const taskId = this._nextTaskId();
        instructions += "\n" + kernal.newTCB(taskId, PC);
        //make this the new tail
        instructions += "\n" + kernal.setTCBToTail();
        const start = this.rtos._loadKernalInstructions(instructions);
        this.rtos.startProgram(start);
    }
    /**
     * finds open TCB locations and stores in register 2
     */
    _findTCBOpenLocation() {
        const instructions = kernal.findEmptyTCB();
        const start = this.rtos._loadKernalInstructions(instructions);
        this.rtos.startProgram(start);
        console.log("empty block = " + this.rtos.cpu.readRegister(2));
    }
    _findTCBBlockAddress(taskId) {
        const instructions = kernal.findTaskTCB(taskId);
        const start = this.rtos._loadKernalInstructions(instructions);
        this.rtos.startProgram(start);
        return this.rtos.cpu.readRegister(2);
    }
    newTask(task) {
        if (this.head === undefined) {
            this.head = task;
            this.tail = task;
        }
        else {
            this.tail.next = task;
            this.tail = task;
        }
    }
}
Scheduler.TCB_SIZE = 128; // 32 registers with 4 bytes each
Scheduler.TCB_STACK_SIZE = 4;
Scheduler.TCB_SIZE_TOTAL = Scheduler.TCB_SIZE * Scheduler.TCB_STACK_SIZE;
Scheduler.TCB_START_ADDRESS = 0;
Scheduler.TIME_SLICE = 10000;
Scheduler.HEAD_ADDRESS = 512;
Scheduler.TAIL_ADDRESS = 516;
var TaskStatus;
(function (TaskStatus) {
    TaskStatus[TaskStatus["RUNNING"] = 1] = "RUNNING";
    TaskStatus[TaskStatus["READY"] = 2] = "READY";
    TaskStatus[TaskStatus["SUSPENDED"] = 3] = "SUSPENDED";
    TaskStatus[TaskStatus["DORMANT"] = 4] = "DORMANT";
})(TaskStatus || (TaskStatus = {}));
class Task {
}
var CpuStatus;
(function (CpuStatus) {
    CpuStatus[CpuStatus["IDLE"] = 0] = "IDLE";
    CpuStatus[CpuStatus["RUNNING"] = 1] = "RUNNING";
    CpuStatus[CpuStatus["INTERRUPTED"] = 2] = "INTERRUPTED";
})(CpuStatus || (CpuStatus = {}));
/**
 * Object representing the CPU
 */
class CPU extends EventDispatcher {
    constructor(memoryCOR) {
        super();
        this.functionQueue = new FunctionQueue(this);
        this.$0 = new Register(0, 0, "$0", false);
        this.$1 = new Register(1, 0, "$1", false);
        this.PC = new Register(29, 0, "PC", false);
        this.I = new Register(30, 0, "Instruction", false);
        this.$31 = new Register(31, 0, "RA", false);
        this._interruptSignal = 0;
        this.status = CpuStatus.IDLE;
        this.alu = new ALU(this);
        this.initCache(memoryCOR);
        this.registers = [
            this.$0,
            this.$1
        ];
        for (let i = 2; i < 25; i++) {
            this.registers.push(new Register(i, 0));
        }
        // 25 = kernal use
        // 26 = kernal use
        this.registers[25] = new Register(25, 0, "Kernal $0", false);
        this.registers[26] = new Register(26, 0, "Kernal $1", false);
        this.registers[27] = new Register(27, 0);
        this.registers[28] = new Register(28, 0);
        this.registers[this.PC._address] = this.registers["PC"] = this.PC; //29
        this.registers[this.I._address] = this.registers["I"] = this.I; //30
        this.registers[this.$31._address] = this.registers["$31"] = this.$31; //31
        this.PC.value = 0;
    }
    initCache(memoryCOR) {
        this.cacheL1 = new CPUCache(3);
        this.cacheL2 = new CPUCache(4);
        this.cacheL1.successor = this.cacheL2;
        this.cacheL2.successor = memoryCOR;
        this.memoryCOR = this.cacheL1;
    }
    readRegister(index) {
        this.trigger("readRegister", { register: this.registers[index] });
        //console.log("reading register" + index);
        return Number(this.registers[index].value);
    }
    writeRegister(index, value) {
        /*
        if (typeof index === "number" && !this.registers[index].rw) {
          throw "$" + index + " is a readonly register";
        }
        */
        //console.log("writing to register" + index + " value = " + value.toString(2));
        // ensure value is between -2147483647 and 2147483647
        value = Math.min(2147483647, Math.max(-2147483647, value));
        this.registers[index].value = value;
        if (this.registers[index] !== this.registers["I"] || value !== CPU.LOAD_INSTRUCTION) {
            this.trigger("writeRegister", { register: this.registers[index] });
        }
    }
    signalStatus(status) {
        this.status = status;
    }
    fetch() {
        if (this.status !== CpuStatus.RUNNING) {
            return;
        }
        this.writeRegister("I", CPU.LOAD_INSTRUCTION); //store lw instruction to current instruction 
        this.trigger("operation", { operation: "cpu.fetch" });
        this.functionQueue.queue(function () {
            Instructions.LoadWord.execute(this, CPU.LOAD_INSTRUCTION);
            if (this._interruptSignal !== 0) {
                // next instructions is loaded
                this.status = CpuStatus.INTERRUPTED;
                this.writeRegister(1, this.readRegister(29)); //save the program counter
                this._interruptSignal = 0;
                return;
            }
            this.functionQueue.queue(function () {
                this.writeRegister(29, this.registers[29].value + 4); //increment PC after instruction load
                this.functionQueue.queue(this.decode); // decode next instruction
            });
        });
    }
    decode() {
        //console.log("decode");
        this.trigger("operation", { operation: "cpu.decode" });
        const instruction = this.readRegister("I");
        this._currentInstructionConfig = Assembler.decode(instruction);
        // validation
        if (this._currentInstructionConfig === undefined) {
            throw "Invalid instruction";
        }
        this.functionQueue.queue(this.execute); // run current instruction
        this.functionQueue.queue(this.fetch); // fetch next instruction
    }
    execute() {
        //console.log("execute");
        if (this.I.value === 0) {
            this.functionQueue.empty();
            this.trigger("program.end");
            console.log("end of program");
            this.status = CpuStatus.IDLE;
            return;
        }
        const iValueBefore = this.I.value;
        this._currentInstructionConfig.execute(this, this.I.value);
        if (this._currentInstructionConfig !== Instructions.LoadWord || iValueBefore !== CPU.LOAD_INSTRUCTION) {
            this.trigger("operation", { operation: "cpu.execute" });
        }
    }
    clearCache(init) {
        this.cacheL1.clear(init);
        this.cacheL2.clear(init);
    }
    interrupt() {
        if (this._interruptSignal !== 0 || this.status === CpuStatus.INTERRUPTED) {
            console.error("already interrupted");
            return new Promise(function (resolve, reject) {
                reject("Reject: already interrupted");
            });
        }
        this._interruptSignal = 1;
        return new Promise(_.bind(function (cpu, resolve, reject) {
            const check = function () {
                if (cpu.status === CpuStatus.INTERRUPTED || cpu.status === CpuStatus.IDLE) {
                    resolve("interrupted");
                    return;
                }
                setTimeout(check, 100);
            };
            check();
        }, this, this));
    }
}
CPU.LOAD_INSTRUCTION = Assembler.assemble("lw 30 29");
CPU.REGISTERS = [2, 3, 4, 5, 6, 7, 8, 9, 25, 26, 29, 30, 31];
class ALU extends EventDispatcher {
    constructor(cpu) {
        super();
        this.cpu = cpu;
        this.HI = 0;
        this.LO = 0;
    }
    add(one, two, d) {
        this.cpu.functionQueue.front(_.bind(function () {
            this.cpu.writeRegister(d, one + two);
            this.trigger("add", { operation: "add", one: one, two: two });
        }, this));
    }
    subtract(one, two, d) {
        this.cpu.functionQueue.front(_.bind(function () {
            this.cpu.writeRegister(d, one - two);
            this.trigger("subtract", { operation: "subtract", one: one, two: two });
        }, this));
    }
    multiply(one, two) {
        let res = binaryMultiply(one, two);
        this.cpu.functionQueue.front(_.bind(function () {
            this.HI = res.HI;
            this.LO = res.LO;
            this.trigger("multiply", { operation: "multiply", HI: this.HI, LO: this.LO, one: one, two: two });
        }, this));
    }
    divide(one, two) {
        this.cpu.functionQueue.front(_.bind(function () {
            this.HI = one % two;
            this.LO = Math.floor(one / two);
            this.trigger("divide", { operation: "divide", HI: this.HI, LO: this.LO, one: one, two: two });
        }, this));
    }
    moveFromHI(dest) {
        this.cpu.functionQueue.front(_.bind(function () {
            this.cpu.writeRegister(dest, this.HI);
            this.trigger("moveFromHI", { operation: "Move From HI" });
        }, this));
    }
    moveFromLO(dest) {
        this.cpu.functionQueue.front(_.bind(function () {
            this.cpu.writeRegister(dest, this.LO);
            this.trigger("moveFromLO", { operation: "Move From LO" });
        }, this));
    }
}
/**
 * Clock that governs pulses for controllers
 */
class Clock extends EventDispatcher {
    constructor(freq) {
        super();
        this.timeoutFn = _.bind(this.pulse, this);
        this.interval = undefined;
        this.items = [];
        this._tick = 0;
        this._frequency = freq || Clock.DEFAULT_FREQUENCY;
    }
    pulse() {
        for (let item of this.items) {
            item.pulse();
        }
        this.trigger("pulsed", this._tick++);
    }
    start(frequency) {
        if (frequency > 0)
            this._frequency = frequency;
        this.interval = self.setInterval(this.timeoutFn, this._frequency);
        this.trigger("clock.start", { frequency: this._frequency });
    }
    pause() {
        if (this.interval !== undefined) {
            self.clearInterval(this.interval);
            this.trigger("clock.pause");
        }
    }
    addItem(item) {
        this.items.push(item);
    }
    set frequency(newFrequency) {
        this._frequency = newFrequency;
    }
}
Clock.DEFAULT_FREQUENCY = 2000;
/**
 * Memory address
 */
class MemoryAddress {
    constructor(address) {
        this.address = address;
    }
    convertToPhysical() {
        let binaryAddr = this.address.toString(2);
        return {
            pageNumber: parseInt(binaryAddr.substring(0, ADDRESS_RANGE - PAGE_RANGE)),
            offset: parseInt(binaryAddr.substring(ADDRESS_RANGE - PAGE_RANGE), 2)
        };
    }
}
/**
 * Register
 */
class Register {
    constructor(_address, value, label, rw) {
        this._address = _address;
        this.value = value;
        this.label = label;
        this.rw = rw;
        this.active = false;
        this.rw = rw === undefined ? true : rw;
    }
    getAddress(length) {
        return padBinary(this._address, length);
    }
    getName() {
        return this.label !== undefined ? this.label : this._address.toString();
    }
}
class CPUCache extends EventDispatcher {
    constructor(_indexBitWidth) {
        super();
        this._indexBitWidth = _indexBitWidth;
        this.clear(true);
    }
    _update(loc, value) {
        const b = this._blocks["i" + loc.index];
        b.valid = true;
        b.tag = loc.tag;
        b.value = value & 255; // memory value is 8 bits
        this.trigger("update", { index: loc.index, tag: loc.tag, value: value });
    }
    store(address, value) {
        const loc = this._split(address);
        this._update(loc, value);
        this.successor.store(address, value);
    }
    load(address) {
        const loc = this._split(address), cb = this._blocks["i" + loc.index];
        if (cb.valid && cb.tag === loc.tag) {
            this.trigger("hit", loc);
            return cb.value;
        }
        this.trigger("miss", loc);
        const value = this.successor.load(address);
        this._update(loc, value);
        return value;
    }
    get blocks() {
        const mem = [];
        for (let loc in this._blocks) {
            mem.push(this._blocks[loc]);
        }
        return mem;
    }
    get indexBitWidth() {
        return this._indexBitWidth;
    }
    _split(requestAddress) {
        let binaryAddr = padBinary(requestAddress.address, ADDRESS_RANGE), //convert number to binary
        splitIndex = binaryAddr.length - this._indexBitWidth; // find where to split the address
        return {
            index: binaryAddr.substring(splitIndex),
            tag: binaryAddr.substring(0, splitIndex) //get block tag
        };
    }
    clear(init) {
        // init memory locations
        const defaultTag = padBinary(0, ADDRESS_RANGE - this._indexBitWidth);
        this._blocks = {};
        for (let i = 0; i < Math.pow(2, this._indexBitWidth); i++) {
            let index = padBinary(i, this._indexBitWidth);
            this._blocks["i" + index] = new CacheBlock(index, false, defaultTag, 0);
            if (init !== true)
                this.trigger("update", { index: index, tag: defaultTag, value: 0 });
        }
    }
}
class CacheBlock {
    constructor(index, valid, tag, value) {
        this.index = index;
        this.valid = valid;
        this.tag = tag;
        this.value = value;
    }
    valueToBinary() {
        return padBinary(this.value, MEMORY_BLOCK_BITS);
    }
}
class MemoryController {
    constructor(physicalMemory) {
        this.physicalMemory = physicalMemory;
        this.pageTable = {};
    }
    load(address) {
        //let physical = requestAddress.convertToPhysical();
        return this.physicalMemory.getBlock(address);
    }
    store(address, value) {
        //let physical = requestAddress.convertToPhysical();
        return this.physicalMemory.setBlock(address, value);
    }
}
MemoryController.PREFIX = "e";
class PageTableEntry {
    constructor(valid, pageNumber) {
        this.valid = valid;
        this.pageNumber = pageNumber;
    }
}
/*
abstract class PageHandler {
  private static PREFIX = "p";
  private static MAX_OFFSET = 1024;
 
  protected pages: { [key: string]: Page } = {};
 
  lookup(addr: PhysicalAddress): number {
    let page = this.pages[PageHandler.PREFIX + addr.pageNumber];
    return page.data[addr.offset];
  }
 
  store(addr: PhysicalAddress, value: number): void {
    let page = this.pages[PageHandler.PREFIX + addr.pageNumber];
    page.data[addr.offset] = value & 255; //store 8 bits
  }
 
  
  allocate(addr: PhysicalAddress, size: number): void {
    let page = this.pages[PageHandler.PREFIX + addr.pageNumber];
 
    if (!page) {
      //create page is it doesn't exist
      this.pages[PageHandler.PREFIX + addr.pageNumber] = new Page(addr.pageNumber);
    }
 
    let end = addr.offset + size;
    for (let i = addr.offset, d = page.data; i < end; i++) {
      d[i] = 0;
    }
  }
  
}
*/
class Page {
    constructor(_pageNumber) {
        this._pageNumber = _pageNumber;
        this.data = [];
    }
    get pageNumber() {
        return this._pageNumber;
    }
}
class PhysicalMemory extends EventDispatcher {
    constructor() {
        super();
        this.blocks = new Array(PHYSICAL_MEMORY_BITS).fill(0);
    }
    setBlock(address, value) {
        this.blocks[address.address] = value & 255;
        this.trigger("store", { address: address, value: value });
    }
    getBlock(address) {
        this.trigger("load", { address: address });
        return this.blocks[address.address];
    }
    directReadWord(address) {
        return this.blocks[address] << 24 | this.blocks[address + 1] << 16 | this.blocks[address + 2] << 8 | this.blocks[address + 3];
    }
}
