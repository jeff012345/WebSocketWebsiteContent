var Assembler;
(function (Assembler) {
    function assemble(instruction) {
        let parts = instruction.split(" "), operation = parts.shift().toLowerCase(), config;
        for (let name in Instructions) {
            let c = Instructions[name];
            if (c.instruction !== undefined && c.instruction === operation) {
                config = c;
                break;
            }
        }
        if (config === undefined) {
            throw "Invalid instruction: '" + instruction + "'";
        }
        return autoAssemble(config, parts);
    }
    Assembler.assemble = assemble;
    function decode(instruction) {
        let instructionConfig;
        const opCode = (instruction >> 26) & 31;
        if (opCode === 0) {
            // find where opCode == 0 and function code matches
            const functionCode = instruction & 31;
            let name = Object.keys(Instructions)
                .find(k => Instructions[k].opCode === 0 && Instructions[k].functionCode === functionCode);
            instructionConfig = Instructions[name];
        }
        else {
            // find opCode match
            let name = Object.keys(Instructions).find(k => Instructions[k].opCode === opCode);
            instructionConfig = Instructions[name];
        }
        return instructionConfig;
    }
    Assembler.decode = decode;
    function disassemble(instruction) {
        let instructionConfig = decode(instruction);
        let parts = [];
        parts.push(instructionConfig.instruction);
        if (instructionConfig.iType === "R") {
            for (let p of instructionConfig.schema) {
                if (p === 's') {
                    parts.push((instruction >> 21) & 31);
                }
                else if (p === 't') {
                    parts.push((instruction >> 16) & 31);
                }
                else if (p === 'd') {
                    parts.push((instruction >> 11) & 31);
                }
                else if (p === 'shamt') {
                    parts.push((instruction >> 6) & 31);
                }
            }
        }
        else if (instructionConfig.iType === "I") {
            for (let p of instructionConfig.schema) {
                if (p === 's') {
                    parts.push((instruction >> 21) & 31);
                }
                else if (p === 't') {
                    parts.push((instruction >> 16) & 31);
                }
                else if (p === 'i') {
                    parts.push(instruction & 65535);
                }
            }
        }
        else if (instructionConfig.iType === "J") {
            parts.push(instruction & 67108863);
        }
        return parts.join(" ");
    }
    Assembler.disassemble = disassemble;
    // Type R
    // 01234567890123456789012345678901
    //  |---||---||---||---||---||----|
    //    1    2    3    4    5     6
    // 1 = Op Code (5)
    // 2 = reg s(5) i.e. first register
    // 3 = reg t(5) i.e. second register
    // 4 = reg d(5) i.e. destination
    // 5 = shamt(5)
    // 6 = function code (6)
    function assembleTypeR(opCode, s, t, d, shamt, functionCode) {
        //0
        // 1111100000000000000000000000000 = op code
        //      11111000000000000000000000 = s
        //           111110000000000000000 = t
        //                1111100000000000 = d
        //                     11111000000 = shamt (shift amount)
        //                          111111 = function code
        return ((opCode & 31) << 26) | ((s & 31) << 21) | ((t & 31) << 16) | ((d & 31) << 11) | ((shamt & 31) << 6) | (functionCode & 63);
    }
    // Type I
    // 01234567890123456789012345678901
    //  |---||---||---||--------------|
    //    1    2    3         4      
    // 1 = Op Code (5)
    // 2 = reg s(5) i.e. first register
    // 3 = reg t(5) i.e. second register
    // 4 = immediate (16) i.e. static value
    function assembleTypeI(opCode, s, t, immediate) {
        //0
        // 1111100000000000000000000000000 = opcode
        //      11111000000000000000000000 = s
        //           111110000000000000000 = t
        //                1111111111111111 = immediate
        return ((opCode & 31) << 26) | ((s & 31) << 21) | ((t & 31) << 16) | (immediate & 65535);
    }
    // Type J
    // 01234567890123456789012345678901
    //  |---||------------------------|
    //    1              2            
    // 1 = Op Code (5)
    // 2 = address(26)
    function assembleTypeJ(opCode, address) {
        //0
        // 1111100000000000000000000000000
        //      11111111111111111111111111
        return ((opCode & 31) << 26) | (address & 67108863);
    }
    function autoAssemble(config, parts) {
        let instruction = {};
        for (let i = 0; i < config.schema.length; i++) {
            instruction[config.schema[i]] = Number(parts[i] || 0);
        }
        if (config.iType === "R") {
            return assembleTypeR(config.opCode, instruction["s"] || 0, instruction["t"] || 0, instruction["d"] || 0, instruction["shamt"] || 0, config.functionCode);
        }
        else if (config.iType === "I") {
            return assembleTypeI(config.opCode, instruction["s"] || 0, instruction["t"] || 0, instruction["i"] || 0);
        }
        else if (config.iType === "J") {
            return assembleTypeJ(config.opCode, instruction["a"] || 0);
        }
    }
})(Assembler || (Assembler = {}));
