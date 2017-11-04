var Instructions;
(function (Instructions) {
    Instructions.Util = {};
    /*======================================================================
     * Arithmetic
     *====================================================================*/
    Instructions.Add = {
        format: "$d $s $t",
        iType: "R",
        instruction: "add",
        opCode: 0,
        functionCode: 9,
        schema: ['d', 's', 't'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, d = (instruction >> 11) & 31;
            s = cpu.readRegister(s);
            t = cpu.readRegister(t);
            //cpu.writeRegister(d, s + t);
            cpu.alu.add(s, t, d);
        }
    };
    Instructions.AddImmediate = {
        format: "$t $s C",
        iType: "I",
        instruction: "addi",
        opCode: 8,
        functionCode: 0,
        schema: ['t', 's', 'i'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, i = instruction & 65535;
            s = cpu.readRegister(s);
            //cpu.writeRegister(t, s + i);
            cpu.alu.add(s, i, t);
        }
    };
    Instructions.Subtract = {
        format: "$d $s $t",
        iType: "R",
        instruction: "sub",
        opCode: 0,
        functionCode: 31,
        schema: ['d', 's', 't'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, d = (instruction >> 11) & 31;
            s = cpu.readRegister(s);
            t = cpu.readRegister(t);
            cpu.alu.subtract(s, t, d);
            //cpu.writeRegister(d, s - t);
        }
    };
    Instructions.SubtractImmediate = {
        format: "$t $s C",
        iType: "I",
        instruction: "subi",
        opCode: 11,
        functionCode: 0,
        schema: ['t', 's', 'i'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, i = instruction & 65535;
            s = cpu.readRegister(s);
            //cpu.writeRegister(t, s - i);
            cpu.alu.subtract(s, i, t);
        }
    };
    Instructions.Multiply = {
        format: "$s $t",
        iType: "R",
        instruction: "mult",
        opCode: 0,
        functionCode: 24,
        schema: ['s', 't'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31;
            s = cpu.readRegister(s);
            t = cpu.readRegister(t);
            //let res = binaryMultiply(s, t);
            cpu.alu.multiply(s, t);
        }
    };
    Instructions.Divide = {
        format: "$s $t",
        iType: "R",
        instruction: "div",
        opCode: 0,
        functionCode: 26,
        schema: ['s', 't'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31;
            s = cpu.readRegister(s);
            t = cpu.readRegister(t);
            cpu.alu.divide(s, t);
        }
    };
    /*======================================================================
     * Data
     *====================================================================*/
    Instructions.LoadWord = {
        format: "$t $s",
        iType: "I",
        instruction: "lw",
        opCode: 4,
        functionCode: 0,
        schema: ['t', 's'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, // get s from instruction
            t = (instruction >> 16) & 31; //get t from instruction
            //load the 4 bytes in $s into address location stored in $t
            s = cpu.readRegister(s);
            let value1 = cpu.memoryCOR.load(new MemoryAddress(s)), value2 = cpu.memoryCOR.load(new MemoryAddress(s + 1)), value3 = cpu.memoryCOR.load(new MemoryAddress(s + 2)), value4 = cpu.memoryCOR.load(new MemoryAddress(s + 3));
            cpu.writeRegister(t, value1 << 24 | value2 << 16 | value3 << 8 | value4);
        }
    };
    Instructions.LoadHalfWord = {
        format: "$t $s",
        iType: "I",
        instruction: "lh",
        opCode: 16,
        functionCode: 0,
        schema: ['t', 's'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, // get s from instruction
            t = (instruction >> 16) & 31; //get t from instruction
            //load the 2 bytes in $s into address location stored in $t
            s = cpu.readRegister(s);
            let value1 = cpu.memoryCOR.load(new MemoryAddress(s)), value2 = cpu.memoryCOR.load(new MemoryAddress(s + 1));
            cpu.writeRegister(t, value1 << 8 | value2);
        }
    };
    Instructions.LoadByte = {
        format: "$t $s",
        iType: "I",
        instruction: "lb",
        opCode: 17,
        functionCode: 0,
        schema: ['t', 's'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, // get s from instruction
            t = (instruction >> 16) & 31; //get t from instruction
            //load the 2 bytes in $s into address location stored in $t
            s = cpu.readRegister(s);
            let value1 = cpu.memoryCOR.load(new MemoryAddress(s));
            cpu.writeRegister(t, value1);
        }
    };
    // store word from register t into address s
    Instructions.StoreWord = {
        format: "$t $s",
        iType: "I",
        instruction: "sw",
        opCode: 9,
        functionCode: 0,
        schema: ['t', 's'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, //get s from instruction
            t = (instruction >> 16) & 31; // get t from instruction
            //store the 4 bytes in $t into address location stored in $s
            t = cpu.readRegister(t);
            s = cpu.readRegister(s);
            cpu.memoryCOR.store(new MemoryAddress(s), t >> 24);
            cpu.memoryCOR.store(new MemoryAddress(s + 1), (t >> 16) & 255);
            cpu.memoryCOR.store(new MemoryAddress(s + 2), (t >> 8) & 255);
            cpu.memoryCOR.store(new MemoryAddress(s + 3), t & 255);
        }
    };
    Instructions.StoreHalfWord = {
        format: "$t $s",
        iType: "I",
        instruction: "sh",
        opCode: 18,
        functionCode: 0,
        schema: ['t', 's'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, //get s from instruction
            t = (instruction >> 16) & 31; // get t from instruction
            //store the 2 bytes in $t into address location stored in $s
            t = cpu.readRegister(t);
            s = cpu.readRegister(s);
            cpu.memoryCOR.store(new MemoryAddress(s), (t >> 8) & 255);
            cpu.memoryCOR.store(new MemoryAddress(s + 1), t & 255);
        }
    };
    Instructions.StoreByte = {
        format: "$t $s",
        iType: "I",
        instruction: "sb",
        opCode: 19,
        functionCode: 0,
        schema: ['t', 's'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, //get s from instruction
            t = (instruction >> 16) & 31; // get t from instruction
            //store the 1 byte in $t into address location stored in $s
            t = cpu.readRegister(t);
            s = cpu.readRegister(s);
            cpu.memoryCOR.store(new MemoryAddress(s), t & 255);
        }
    };
    Instructions.LoadUpperImmediate = {
        format: "$t C",
        iType: "I",
        instruction: "lui",
        opCode: 15,
        functionCode: 0,
        schema: ['t', 'i'],
        execute: function (cpu, instruction) {
            let t = (instruction >> 16) & 31, i = instruction & 65535;
            cpu.writeRegister(t, i << 16);
        }
    };
    Instructions.MoveFromHI = {
        format: "$d",
        iType: "R",
        instruction: "mfhi",
        opCode: 0,
        functionCode: 20,
        schema: ['d'],
        execute: function (cpu, instruction) {
            let d = (instruction >> 11) & 31;
            cpu.alu.moveFromHI(d);
        }
    };
    Instructions.MoveFromLO = {
        format: "$d",
        iType: "R",
        instruction: "mflo",
        opCode: 0,
        functionCode: 21,
        schema: ['d'],
        execute: function (cpu, instruction) {
            let d = (instruction >> 11) & 31;
            cpu.alu.moveFromLO(d);
        }
    };
    /*======================================================================
     * Logical
     *====================================================================*/
    Instructions.And = {
        format: "$d $s $t",
        iType: "R",
        instruction: "and",
        opCode: 0,
        functionCode: 4,
        schema: ['d', 's', 't'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, d = (instruction >> 11) & 31;
            s = cpu.readRegister(s);
            t = cpu.readRegister(t);
            cpu.writeRegister(d, s & t);
        }
    };
    Instructions.AndImmediate = {
        format: "$d $s C",
        iType: "I",
        instruction: "andi",
        opCode: 12,
        functionCode: 0,
        schema: ['t', 's', 'i'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, i = instruction & 65535;
            s = cpu.readRegister(s);
            cpu.writeRegister(t, s & i);
        }
    };
    Instructions.Or = {
        format: "$d $s $t",
        iType: "R",
        instruction: "or",
        opCode: 0,
        functionCode: 5,
        schema: ['d', 's', 't'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, d = (instruction >> 11) & 31;
            s = cpu.readRegister(s);
            t = cpu.readRegister(t);
            cpu.writeRegister(d, s | t);
        }
    };
    Instructions.OrImmediate = {
        format: "$d $s C",
        iType: "I",
        instruction: "ori",
        opCode: 13,
        functionCode: 0,
        schema: ['t', 's', 'i'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, i = instruction & 65535;
            s = cpu.readRegister(s);
            cpu.writeRegister(t, s | i);
        }
    };
    Instructions.XOr = {
        format: "$d $s $t",
        iType: "R",
        instruction: "xor",
        opCode: 0,
        functionCode: 6,
        schema: ['d', 's', 't'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, d = (instruction >> 11) & 31;
            s = cpu.readRegister(s);
            t = cpu.readRegister(t);
            cpu.writeRegister(d, s ^ t);
        }
    };
    Instructions.XOrImmediate = {
        format: "$d $s C",
        iType: "I",
        instruction: "xori",
        opCode: 14,
        functionCode: 0,
        schema: ['t', 's', 'i'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, i = instruction & 65535;
            s = cpu.readRegister(s);
            cpu.writeRegister(t, s ^ i);
        }
    };
    Instructions.NOr = {
        format: "$d $s $t",
        iType: "R",
        instruction: "nor",
        opCode: 0,
        functionCode: 7,
        schema: ['d', 's', 't'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, d = (instruction >> 11) & 31;
            s = cpu.readRegister(s);
            t = cpu.readRegister(t);
            cpu.writeRegister(d, ~(s | t));
        }
    };
    Instructions.SetLT = {
        format: "$d $s $t",
        iType: "R",
        instruction: "slt",
        opCode: 0,
        functionCode: 10,
        schema: ['d', 's', 't'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, d = (instruction >> 11) & 31;
            s = cpu.readRegister(s);
            t = cpu.readRegister(t);
            cpu.writeRegister(d, s < t ? 1 : 0);
        }
    };
    Instructions.SetLTImmediate = {
        format: "$d $s C",
        iType: "I",
        instruction: "slti",
        opCode: 10,
        functionCode: 0,
        schema: ['t', 's', 'i'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, i = instruction & 65535;
            s = cpu.readRegister(s);
            cpu.writeRegister(t, s < i ? 1 : 0);
        }
    };
    /*===================================================================================================
     * Bitwise Shift
     *=================================================================================================*/
    Instructions.ShiftLeftLI = {
        format: "$d $t shamt",
        iType: "R",
        instruction: "sll",
        opCode: 0,
        functionCode: 0,
        schema: ['d', 't', 'shamt'],
        execute: function (cpu, instruction) {
            let t = (instruction >> 16) & 31, d = (instruction >> 11) & 31, shamt = (instruction >> 6) & 31;
            t = cpu.readRegister(t);
            cpu.writeRegister(d, t << shamt);
        }
    };
    Instructions.ShiftLeftLogical = {
        format: "$d $t $s",
        iType: "R",
        instruction: "sllv",
        opCode: 0,
        functionCode: 1,
        schema: ['d', 't', 's'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, d = (instruction >> 11) & 31;
            s = cpu.readRegister(s);
            t = cpu.readRegister(t);
            cpu.writeRegister(d, t << s);
        }
    };
    Instructions.ShiftRightLI = {
        format: "$d $t shamt",
        iType: "R",
        instruction: "srl",
        opCode: 0,
        functionCode: 2,
        schema: ['d', 't', 'shamt'],
        execute: function (cpu, instruction) {
            let t = (instruction >> 16) & 31, d = (instruction >> 11) & 31, shamt = (instruction >> 6) & 31;
            t = cpu.readRegister(t);
            cpu.writeRegister(d, t >> shamt);
        }
    };
    Instructions.ShiftRightLogical = {
        format: "$d $t $s",
        iType: "R",
        instruction: "srlv",
        opCode: 0,
        functionCode: 3,
        schema: ['d', 't', 's'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, d = (instruction >> 11) & 31;
            s = cpu.readRegister(s);
            t = cpu.readRegister(t);
            cpu.writeRegister(d, t >> s);
        }
    };
    Instructions.ShiftRightAI = {
        format: "$d $t shamt",
        iType: "R",
        instruction: "sra",
        opCode: 0,
        functionCode: 11,
        schema: ['d', 't', 'shamt'],
        execute: function (cpu, instruction) {
            let t = (instruction >> 16) & 31, d = (instruction >> 11) & 31, shamt = (instruction >> 6) & 31;
            t = cpu.readRegister(t);
            if (t < 0) {
                t = (Math.abs(t) >> shamt) | ((1 << shamt) - 1 << (31 - shamt));
                cpu.writeRegister(d, -1 * t);
            }
            else {
                cpu.writeRegister(d, t >> shamt);
            }
        }
    };
    Instructions.ShiftRightArithmetic = {
        format: "$d $t $s",
        iType: "R",
        instruction: "srav",
        opCode: 0,
        functionCode: 12,
        schema: ['d', 't', 's'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, d = (instruction >> 11) & 31;
            s = cpu.readRegister(s);
            t = cpu.readRegister(t);
            if (t < 0) {
                t = (Math.abs(t) >> s) | ((1 << s) - 1 << (31 - s));
                cpu.writeRegister(d, -1 * t);
            }
            else {
                cpu.writeRegister(d, t >> s);
            }
        }
    };
    /*===================================================================================================
     * Conditional Branch
     *=================================================================================================*/
    Instructions.BranchOnEq = {
        format: "$s $t C",
        iType: "I",
        instruction: "beq",
        opCode: 6,
        functionCode: 0,
        schema: ['s', 't', 'i'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, i = instruction & 65535;
            s = cpu.readRegister(s);
            t = cpu.readRegister(t);
            if (s === t) {
                cpu.PC.value += 4 * i;
            }
        }
    };
    Instructions.BranchOnNeq = {
        format: "$s $t C",
        iType: "I",
        instruction: "bne",
        opCode: 5,
        functionCode: 0,
        schema: ['s', 't', 'i'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31, t = (instruction >> 16) & 31, i = instruction & 65535;
            s = cpu.readRegister(s);
            t = cpu.readRegister(t);
            if (s !== t)
                cpu.PC.value += 4 * i;
        }
    };
    /*===================================================================================================
     * Unconditional jump
     *=================================================================================================*/
    Instructions.Jump = {
        format: "$a",
        iType: "J",
        instruction: "j",
        opCode: 2,
        functionCode: 0,
        schema: ['a'],
        execute: function (cpu, instruction) {
            let a = instruction & 67108863;
            cpu.writeRegister(cpu.PC._address, cpu.PC.value + 4 * a);
        }
    };
    Instructions.JumpRegister = {
        format: "$s",
        iType: "R",
        instruction: "jr",
        opCode: 0,
        functionCode: 8,
        schema: ['s'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31;
            s = cpu.readRegister(s);
            cpu.writeRegister(cpu.PC._address, s);
            //cpu.PC.value = s;
        }
    };
    Instructions.JumpAndLink = {
        format: "$a",
        iType: "J",
        instruction: "jal",
        opCode: 3,
        functionCode: 0,
        schema: ['a'],
        execute: function (cpu, instruction) {
            let a = instruction & 67108863;
            cpu.writeRegister(31, cpu.PC.value);
            cpu.writeRegister(cpu.PC._address, cpu.PC.value + 4 * a);
            //cpu.$31.value = cpu.PC.value + 4;
            //cpu.PC.value += 4 + 4 * a;
        }
    };
    Instructions.JumpAndLinkRegister = {
        format: "$s",
        iType: "R",
        instruction: "jalr",
        opCode: 7,
        functionCode: 0,
        schema: ['s'],
        execute: function (cpu, instruction) {
            let s = (instruction >> 21) & 31;
            s = cpu.readRegister(s);
            cpu.writeRegister(31, cpu.PC.value);
            cpu.writeRegister(cpu.PC._address, s);
            //cpu.$31.value = cpu.PC.value + 4;
            //cpu.PC.value = s;
        }
    };
    /*======================================================================
     * Tests
     *====================================================================*/
    Instructions.Util['test'] = function (rtos) {
        if (rtos === undefined || !(rtos instanceof RTOS))
            throw "Must provide RTOS";
        let success = true;
        rtos.cpu.functionQueue.noWait();
        removeListeners();
        // test two instructions with same name
        let list = {};
        for (let name in Instructions) {
            if (list[name] !== undefined) {
                success = false;
                console.error("Duplicate instruction names '" + name + "'");
            }
            list[name] = true;
        }
        // test no two function and op codes are the same
        for (let name in Instructions) {
            if (name === "Util")
                continue;
            let c1 = Instructions[name];
            for (let name in Instructions) {
                let c2 = Instructions[name];
                if (c1 == c2)
                    continue;
                if (c1.opCode === c2.opCode && c1.functionCode === c2.functionCode) {
                    console.error("duplicate instruction opCode and functionCode", c1, c2);
                    success = false;
                }
            }
        }
        // helper functions
        function regEq(r, v) {
            return cpu.readRegister(r) === v;
        }
        function exec(iType, instruction) {
            try {
                iType.execute(cpu, Assembler.assemble(instruction));
            }
            catch (e) {
                console.error(e);
                success = false;
            }
        }
        function validate(result, iType) {
            if (!result) {
                console.error("failed to " + iType.instruction);
                success = false;
            }
        }
        let r;
        const cpu = rtos.cpu;
        //=====================================================================================================
        // Arithmetic
        //=====================================================================================================
        // add
        cpu.writeRegister(2, 10);
        cpu.writeRegister(3, 5);
        cpu.writeRegister(4, 0);
        exec(Instructions.Add, "add 4 3 2");
        validate(regEq(4, 15), Instructions.Add);
        // subtract
        cpu.writeRegister(2, 10);
        cpu.writeRegister(3, 5);
        cpu.writeRegister(4, 0);
        exec(Instructions.Subtract, "sub 4 2 3");
        validate(regEq(4, 5), Instructions.Subtract);
        // add immediate
        cpu.writeRegister(2, 10);
        cpu.writeRegister(3, 0);
        exec(Instructions.AddImmediate, "addi 3 2 87");
        validate(regEq(3, 97), Instructions.AddImmediate);
        // multiply
        cpu.alu.HI = 1;
        cpu.alu.LO = 1;
        cpu.writeRegister(4, 56498195);
        cpu.writeRegister(5, 785);
        exec(Instructions.Multiply, "mult 4 5");
        // 1010 | 0101 0011 1000 0111 1101 0010 0100 0011
        r = cpu.alu.HI === 10 && cpu.alu.LO === 1401410115;
        validate(r, Instructions.Multiply);
        // divide
        cpu.alu.HI = 1;
        cpu.alu.LO = 1;
        cpu.writeRegister(2, 87);
        cpu.writeRegister(3, 10);
        exec(Instructions.Divide, "div 2 3");
        r = cpu.alu.HI === 7 && cpu.alu.LO === 8;
        validate(r, Instructions.Divide);
        //=====================================================================================================
        // Data transfer
        //=====================================================================================================
        // load word
        rtos.physicalMemory.setBlock(new MemoryAddress(17), 1234567890 >> 24);
        rtos.physicalMemory.setBlock(new MemoryAddress(18), (1234567890 >> 16) & 255);
        rtos.physicalMemory.setBlock(new MemoryAddress(19), (1234567890 >> 8) & 255);
        rtos.physicalMemory.setBlock(new MemoryAddress(20), 1234567890 & 255);
        cpu.clearCache();
        cpu.writeRegister(2, 17);
        cpu.writeRegister(3, 0);
        exec(Instructions.LoadWord, "lw 3 2");
        validate(regEq(3, 1234567890), Instructions.LoadWord);
        // load half word
        rtos.physicalMemory.setBlock(new MemoryAddress(17), 61264 >> 8); // upper half
        rtos.physicalMemory.setBlock(new MemoryAddress(18), 61264 & 255); // lower half
        cpu.writeRegister(2, 17);
        cpu.writeRegister(3, 0);
        cpu.clearCache();
        exec(Instructions.LoadHalfWord, "lh 3 2");
        validate(regEq(3, 61264), Instructions.LoadHalfWord);
        // load byte
        rtos.physicalMemory.setBlock(new MemoryAddress(17), 202);
        cpu.writeRegister(2, 17);
        cpu.writeRegister(3, 0);
        cpu.clearCache();
        exec(Instructions.LoadByte, "lb 3 2");
        validate(regEq(3, 202), Instructions.LoadByte);
        // store word
        cpu.writeRegister(2, 17);
        cpu.writeRegister(3, 1234567890);
        rtos.physicalMemory.setBlock(new MemoryAddress(17), 0);
        rtos.physicalMemory.setBlock(new MemoryAddress(18), 0);
        rtos.physicalMemory.setBlock(new MemoryAddress(19), 0);
        rtos.physicalMemory.setBlock(new MemoryAddress(20), 0);
        cpu.clearCache();
        exec(Instructions.StoreWord, "sw 3 2");
        r = rtos.physicalMemory.getBlock(new MemoryAddress(17)) === 1234567890 >> 24
            && rtos.physicalMemory.getBlock(new MemoryAddress(18)) === ((1234567890 >> 16) & 255)
            && rtos.physicalMemory.getBlock(new MemoryAddress(19)) === ((1234567890 >> 8) & 255)
            && rtos.physicalMemory.getBlock(new MemoryAddress(20)) === (1234567890 & 255);
        validate(r, Instructions.StoreWord);
        // store half word
        cpu.writeRegister(2, 17);
        cpu.writeRegister(3, 61264);
        rtos.physicalMemory.setBlock(new MemoryAddress(17), 0);
        rtos.physicalMemory.setBlock(new MemoryAddress(18), 0);
        cpu.clearCache();
        exec(Instructions.StoreHalfWord, "sh 3 2");
        r = rtos.physicalMemory.getBlock(new MemoryAddress(17)) === (61264 >> 8)
            && rtos.physicalMemory.getBlock(new MemoryAddress(18)) === (61264 & 255);
        validate(r, Instructions.StoreHalfWord);
        // store byte
        cpu.writeRegister(2, 17);
        cpu.writeRegister(3, 202);
        rtos.physicalMemory.setBlock(new MemoryAddress(17), 0);
        cpu.clearCache();
        exec(Instructions.StoreByte, "sb 3 2");
        r = rtos.physicalMemory.getBlock(new MemoryAddress(17)) === 202;
        validate(r, Instructions.StoreByte);
        // load upper immediate
        cpu.writeRegister(2, 0);
        exec(Instructions.LoadUpperImmediate, "lui 2 3837");
        validate(regEq(2, 251461632), Instructions.LoadUpperImmediate);
        // move from HI
        cpu.alu.HI = 555;
        cpu.writeRegister(2, 0);
        exec(Instructions.MoveFromHI, "mfhi 2");
        validate(regEq(2, 555), Instructions.MoveFromHI);
        // move from LO
        cpu.alu.LO = 555;
        cpu.writeRegister(2, 0);
        exec(Instructions.MoveFromHI, "mflo 2");
        validate(regEq(2, 555), Instructions.MoveFromHI);
        //=====================================================================================================
        // logical
        //=====================================================================================================
        // and
        cpu.writeRegister(2, 37);
        cpu.writeRegister(3, 31);
        cpu.writeRegister(4, -1);
        exec(Instructions.And, "and 4 2 3");
        validate(regEq(4, 37 & 31), Instructions.And);
        // add immediate
        cpu.writeRegister(2, 37);
        cpu.writeRegister(4, -1);
        exec(Instructions.AndImmediate, "andi 4 2 31");
        validate(regEq(4, 37 & 31), Instructions.AndImmediate);
        // or
        cpu.writeRegister(2, 37);
        cpu.writeRegister(3, 12);
        cpu.writeRegister(4, -1);
        exec(Instructions.Or, "or 4 2 3");
        validate(regEq(4, 37 | 12), Instructions.Or);
        // or immediate
        cpu.writeRegister(2, 37);
        cpu.writeRegister(4, -1);
        exec(Instructions.OrImmediate, "ori 4 2 12");
        validate(regEq(4, 37 | 12), Instructions.OrImmediate);
        // xor
        cpu.writeRegister(2, 37);
        cpu.writeRegister(3, 12);
        cpu.writeRegister(4, -1);
        exec(Instructions.XOr, "xor 4 2 3");
        validate(regEq(4, 37 ^ 12), Instructions.XOr);
        // xor immediate
        cpu.writeRegister(2, 37);
        cpu.writeRegister(4, -1);
        exec(Instructions.XOrImmediate, "xori 4 2 12");
        validate(regEq(4, 37 ^ 12), Instructions.XOrImmediate);
        // nor
        cpu.writeRegister(2, 37);
        cpu.writeRegister(3, 12);
        cpu.writeRegister(4, -1);
        exec(Instructions.NOr, "nor 4 2 3");
        validate(regEq(4, ~(37 | 12)), Instructions.And);
        // set less than
        cpu.writeRegister(2, 37);
        cpu.writeRegister(3, 12);
        cpu.writeRegister(4, -1);
        exec(Instructions.SetLT, "slt 4 2 3");
        validate(regEq(4, 0), Instructions.SetLT);
        // set less than immediate
        cpu.writeRegister(3, 12);
        cpu.writeRegister(4, -1);
        exec(Instructions.SetLTImmediate, "slti 4 3 37");
        validate(regEq(4, 1), Instructions.SetLTImmediate);
        //=====================================================================================================
        // bitwise operations
        //=====================================================================================================
        // shift left logical immediate
        cpu.writeRegister(2, 12);
        cpu.writeRegister(3, -1);
        exec(Instructions.ShiftLeftLI, "sll 3 2 5");
        validate(regEq(3, 12 << 5), Instructions.ShiftLeftLI);
        // shift left logical
        cpu.writeRegister(2, 12);
        cpu.writeRegister(3, 5);
        cpu.writeRegister(4, -1);
        exec(Instructions.ShiftLeftLogical, "sllv 4 2 3");
        validate(regEq(4, 12 << 5), Instructions.ShiftLeftLogical);
        // shift right logical immediate
        cpu.writeRegister(2, 4698115);
        cpu.writeRegister(3, -1);
        exec(Instructions.ShiftRightLI, "srl 3 2 6");
        validate(regEq(3, 4698115 >> 6), Instructions.ShiftRightLI);
        // shift right logical
        cpu.writeRegister(2, 4698115);
        cpu.writeRegister(3, 6);
        cpu.writeRegister(4, -1);
        exec(Instructions.ShiftRightLogical, "srlv 4 2 3");
        validate(regEq(4, 4698115 >> 6), Instructions.ShiftRightLogical);
        // shift right arithmetic immediate (positive number)
        cpu.writeRegister(2, 4698115);
        cpu.writeRegister(3, -1);
        exec(Instructions.ShiftRightAI, "sra 3 2 6");
        validate(regEq(3, 4698115 >> 6), Instructions.ShiftRightAI);
        // shift right arithmetic  (positive number)
        cpu.writeRegister(2, 4698115);
        cpu.writeRegister(3, 6);
        cpu.writeRegister(4, -1);
        exec(Instructions.ShiftRightArithmetic, "srav 4 2 3");
        validate(regEq(4, 4698115 >> 6), Instructions.ShiftRightArithmetic);
        // shift right arithmetic immediate (negative number)
        cpu.writeRegister(2, -4698115);
        cpu.writeRegister(3, -1);
        exec(Instructions.ShiftRightAI, "sra 3 2 6");
        validate(regEq(3, -1 * parseInt("111111" + padBinary(4698115 >> 6, 31 - 6), 2)), Instructions.ShiftRightAI);
        // shift right arithmetic  (negative number)
        cpu.writeRegister(2, -4698115);
        cpu.writeRegister(3, 6);
        cpu.writeRegister(4, -1);
        exec(Instructions.ShiftRightArithmetic, "srav 4 2 3");
        validate(regEq(4, -1 * parseInt("111111" + padBinary(4698115 >> 6, 31 - 6), 2)), Instructions.ShiftRightArithmetic);
        //=====================================================================================================
        // Conditional Jump
        //=====================================================================================================
        // branch on equal (equal)
        cpu.PC.value = 4;
        cpu.writeRegister(2, 1);
        cpu.writeRegister(3, 1);
        exec(Instructions.BranchOnEq, "beq 2 3 57");
        validate(cpu.PC.value === 4 + 57 * 4, Instructions.BranchOnEq);
        // branch on equal (not equal)
        cpu.PC.value = 4;
        cpu.writeRegister(2, 1);
        cpu.writeRegister(3, 2);
        exec(Instructions.BranchOnEq, "beq 2 3 57");
        validate(cpu.PC.value === 4, Instructions.BranchOnEq);
        // branch on not equal (not equal)
        cpu.PC.value = 4;
        cpu.writeRegister(2, 1);
        cpu.writeRegister(3, 2);
        exec(Instructions.BranchOnNeq, "bne 2 3 57");
        validate(cpu.PC.value === 4 + 57 * 4, Instructions.BranchOnNeq);
        // branch on not equal (equal)
        cpu.PC.value = 4;
        cpu.writeRegister(2, 1);
        cpu.writeRegister(3, 1);
        exec(Instructions.BranchOnNeq, "bne 2 3 57");
        validate(cpu.PC.value === 4, Instructions.BranchOnNeq);
        //=====================================================================================================
        // Unconditional Jump
        //=====================================================================================================
        cpu.PC.value = 8;
        exec(Instructions.Jump, "j 56");
        validate(cpu.PC.value === 8 + 56 * 4, Instructions.Jump);
        cpu.writeRegister(2, 32);
        cpu.PC.value = 0;
        exec(Instructions.JumpRegister, "jr 2");
        validate(cpu.PC.value === 32, Instructions.JumpRegister);
        cpu.$31.value = 0;
        cpu.PC.value = 8;
        exec(Instructions.JumpAndLink, "jal 56");
        r = cpu.PC.value === 8 + 56 * 4 && cpu.$31.value === 8;
        validate(r, Instructions.JumpAndLink);
        cpu.writeRegister(2, 56);
        cpu.$31.value = 0;
        cpu.PC.value = 8;
        exec(Instructions.JumpAndLinkRegister, "jalr 2");
        r = cpu.PC.value === 56 && cpu.$31.value === 8;
        validate(r, Instructions.JumpAndLinkRegister);
        // end
        if (success) {
            console.log("Success!");
        }
    };
})(Instructions || (Instructions = {}));
