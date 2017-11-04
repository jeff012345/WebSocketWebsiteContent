class StatmentLinkedList {
    add(element) {
        if (this.head === undefined) {
            this.head = element;
            this.tail = element;
        }
        else {
            this.tail.next = element;
            this.tail = element;
        }
    }
    /**
     * set through each node gathering the statements
     */
    statements() {
        const statements = [];
        let node = this.head;
        while (node !== undefined) {
            statements.push(node.statement);
            node = node.next;
        }
        return statements;
    }
}
class StatementListNode {
    constructor(statement, label) {
        this.statement = statement;
        this.kind = statement.substring(0, statement.indexOf(" "));
    }
}
class Compiler {
    //private _addressTable: { [name: string]: number } = {};
    compile(code) {
        this._instructions = new StatmentLinkedList();
        this._labelTable = [];
        //this._addressTable = {};
        this._markLabelsAndExpandPseudoStatements(code);
        this._findBranchingStatements();
        return this._instructions.statements();
    }
    _markLabelsAndExpandPseudoStatements(code) {
        //split each line and process
        const lines = code.split("\n");
        const len = lines.length;
        for (let i = 0; i < len; i++) {
            const line = s.trim(lines[i]);
            if (line.length === 0)
                return; //nothing
            const colon = line.indexOf(":");
            if (colon > 0) {
                // label idenifier
                const label = lines[i].substring(0, colon); // get the label text
                let nextLine = "";
                while (nextLine !== "") {
                    i++; // update the counter so we don't compile the same line twice
                    nextLine = s.trim(line[i]); //get the next actual statement
                }
                const lineStatements = this._compileStatement(nextLine); // expand pseudo instructions
                let firstLine = lineStatements.shift();
                this._instructions.add(new StatementListNode(firstLine, label)); // attach the label to the first line
                this._labelTable.push(this._instructions.tail); // save label node for later lookup
                this._labelTable[label] = this._labelTable.length - 1; // save label node for later lookup
                // add the rest of the statements (if any)
                lineStatements.forEach(function (e) {
                    this._instructions.add(new StatementListNode(e));
                }, this);
            }
            else {
                // regualar instruction / expand pseudo instructions
                this._compileStatement(line).forEach(function (e) {
                    this._instructions.add(new StatementListNode(e));
                }, this);
            }
        }
    }
    _findBranchingStatements() {
        let node = this._instructions.head;
        while (node !== undefined) {
            if (this.__isBranchingStatement(node)) {
                // these instructions can possibly have goto labels
                const label = this.__findLabelInStatement(node.statement);
                if (label !== undefined) {
                    const index = this._labelTable[label];
                    node.goto = this._labelTable[index];
                }
            }
            // next
            node = node.next;
        }
    }
    _expandBranches() {
        let labelAddresses = this.__calculateLabelAddresses();
        let node = this._instructions.head, PC = 0;
        while (node !== undefined) {
            if (node.goto !== undefined) {
                const labelPC = labelAddresses[node.goto.label];
                if (labelPC < PC) {
                    // label is before
                    // convert to jump register
                    const newStatments = this.__fixBranch(node.statement.split(" "));
                    // labels after this statement have been shifted down
                    labelAddresses = this.__calculateLabelAddresses();
                }
            }
            // next
            node = node.next;
        }
    }
    __calculateLabelAddresses() {
        const table = {};
        let node = this._instructions.head, PC = 0;
        while (node !== undefined) {
            if (node.label !== undefined) {
                table[node.label] = PC;
            }
            // next
            PC++;
            node = node.next;
        }
        return table;
    }
    __isBranchingStatement(node) {
        return node.kind === Instructions.BranchOnEq.instruction || node.kind === Instructions.BranchOnNeq.instruction
            || node.kind === Instructions.Jump.instruction || node.kind === Instructions.JumpAndLink.instruction;
    }
    __findLabelInStatement(statement) {
        const matchIndex = statement.search(Compiler.LABEL_REGEX);
        if (matchIndex === -1)
            return null;
        //find the label address
        const endIndex = statement.indexOf(" ", matchIndex);
        return statement.substring(matchIndex, endIndex === -1 ? undefined : endIndex);
    }
    /*
    compile(code: string): string[] {
        let instructions: string[] = [];

        //split each line and process
        code.split("\n").forEach(_.bind(function (line, index) {
            line = s.trim(line);
            if (line.length === 0)
                return; //nothing

            const colon = line.indexOf(":");
            if (colon > 0) {
                // label idenifier
                this._labelTable[line.substring(0, colon)] = instructions.length * 4;
            } else {
                // instruction
                instructions.push(...this._compileStatement(line));
            }
        }, this));

        const labelRegex = new RegExp("^(?:[A-Za-z]+[0-9\s]+)([A-Za-z]+)");

        // now that we have compiled all the instructions, the labels need to be dealt with
        let finalInstructions = [], offset = 0;
        instructions.forEach(function (statement, PC) {
            const matchIndex = statement.search(labelRegex);

            if (matchIndex > 0) {
                //statement has a label, so parse it out of the statement

                //find the label address
                const endIndex = statement.indexOf(" ", matchIndex);
                const labelText = statement.substring(matchIndex, endIndex === -1 ? undefined : endIndex);
                const labelAddress = this._labelTable[labelText];

                if (labelAddress === undefined)
                    throw "Compile Error: Label in statement '" + statement + "' not found";

                //replace the label
                if (labelAddress < PC) {
                    // need to jump backwards
                    finalInstructions.push(statement);
                } else {

                }

            } else {
                finalInstructions.push(statement);
            }
        }, this);

        return finalInstructions;
    }
    */
    // compiles a single statement
    _compileStatement(statement) {
        const parts = statement.split(" ");
        // find pseudo instruction if it exists
        const pseudoFn = PuesdoInstructions[parts[0]];
        let statements;
        if (pseudoFn !== undefined) {
            statements = [];
            pseudoFn(parts)
                .forEach(_.bind(function (s) {
                statements.push(...this._compileStatement(s)); // compile each statement
            }, this));
            return statements;
        }
        if (parts[0] === "beq" || parts[0] === "bne" || parts[0] === "j") {
            //branch statement
            statements.push(...this.__fixBranch(parts));
        }
        else {
            // anything else
            statements = [statement];
        }
        return statements;
    }
    _convertLabels(statement) {
        for (let label in this._labelTable) {
            const index = statement.indexOf(label);
            if (index > 0) {
                //prefix LABEL suffix
                //TODO make a negative label
                return statement.substring(0, index) // instruction up to label
                    + this._labelTable[label] // label address location
                    + (statement.length > index + label.length ? statement.substring(index + label.length) : ""); // rest of instruction
            }
        }
        return statement;
    }
    __fixBranch(instruction) {
        const address = Number(instruction[2]);
        if (address < 0 || address > 65535) {
            // jump backwards or jump greater than 16 bits of line count
            return [
                "lui 1 " + (address & (65535 << 16)),
                "ori 1 1 " + (address & 65535),
                "jr 1"
            ];
        }
        else {
            return [instruction.join(" ")];
        }
    }
}
Compiler.LABEL_REGEX = new RegExp("^(?:[A-Za-z]+[0-9\s]+)([A-Za-z]+)");
var PuesdoInstructions;
(function (PuesdoInstructions) {
    function move(parts) {
        return [`add ${parts[1]} ${parts[2]} 0`];
    }
    PuesdoInstructions.move = move;
    ;
    function clear(parts) {
        return [`add ${parts[1]} 0 0`];
    }
    PuesdoInstructions.clear = clear;
    ;
    function not(parts) {
        return [`nor ${parts[1]} ${parts[2]} 0`];
    }
    PuesdoInstructions.not = not;
})(PuesdoInstructions || (PuesdoInstructions = {}));
function testCompiler() {
    const statements = `add 4 3 2
  move 5 6
  test:
  clear 3
  not 3 4
  b test
  `;
    const expected = ["add 4 3 2", "add 5 6 0", "add 3 0 0", "nor 3 4 0", "beq 0 0 8"];
    const c = new Compiler();
    let assembled = c.compile(statements);
    console.log(assembled, expected);
    const wrong = expected.filter((line, index) => assembled[index] !== line);
    if (wrong.length === 0) {
        console.log("correct!");
    }
    else {
        console.log("WRONG!!", wrong);
    }
}
