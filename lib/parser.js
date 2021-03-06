/* global define */

define(['underscore'], function (_) {

    function tokenizePatternDefinitionRHS (str) {
        return _.reduce(str.split(/\b|\s+/), function (output, current) {
            var value = current.trim();
            if ('' !== value) {
                output.push(value);
            }
            return output;
        }, []);
    }

    function parsePatternDefinitionRHS (strTokens) {
        var lists = [];
        var rhs;

        function newList (type) {
            var list = {
                type: type,
                value: [],
                sustain: 1
            };

            if (inList()) {
                lists[lists.length - 1].value.push(list);
            }

            lists.push(list);
        }

        function increaseSustain () {
            if (!inList()) {
                throw new Error('Cannot increase the sustain of an undefined pattern.');
            }
            var currentList = lists[lists.length - 1];
            ++currentList.value[currentList.value.length - 1].sustain;
        }

        function inList (type) {
            return (lists.length > 0) && (undefined === type || lists[lists.length - 1].type === type);
        }

        function endList (type) {
            rhs = lists.pop();
            if (undefined !== type && rhs.type !== type) {
                throw new Error('Invalid list, cannot parse.');
            }
        }

        function append(token) {
            lists[lists.length - 1].value.push({
                type: 'ref',
                value: token,
                sustain: 1
            });
        }

        _.each(strTokens, function (token) {
            if ('[' === token) {
                newList('sum');
            } else if (',' === token) {
                endList('seq');
            } else if (']' === token) {
                endList('seq');
                endList('sum');
            } else if ('^' === token) {
                increaseSustain();
            } else {
                if (!inList('seq')) {
                    newList('seq');
                }
                append(token);
            }
        });

        if (inList('seq')) {
            endList('seq');
        }

        if (inList()) {
            throw new Error('Unterminated list found!');
        }

        return rhs;
    }

    return {
        parseLine: function parseLine (line) {

            if (line.trim() === '') {
                return {type: 'noop'};
            }

            var comment = /^\s*#\s*(.*?)\s*$/.exec(line);
            if (comment) {
                return {
                    type: 'comment',
                    value: comment[1]
                };
            }

            var patternDefinition = /^\s*(\w+)\s*=\s*(.*?)\s*$/.exec(line);
            if (patternDefinition) {
                var lhs = patternDefinition[1];

                return {
                    type: 'patternDefinition',
                    lhs: lhs,
                    rhs: parsePatternDefinitionRHS(tokenizePatternDefinitionRHS(patternDefinition[2]))
                };
            }

            var directive = /^\s*@(\w+)\s*(?:\((.*?)\))?\s*=\s*(.*?)\s*$/.exec(line);
            if (directive) {

                var args = [];

                if (directive[2]) {
                    args = _.map(directive[2].split(','), function (arg) {
                        return arg.trim();
                    });
                }

                return {
                    type: 'directive',
                    name: directive[1],
                    arguments: args,
                    value: directive[3]
                };
            }

            throw new Error('Unrecognized line: ' + line);
        },
        unParseLine: function unParseLine (ast) {

            var str;

            if ('patternDefinition' === ast.type) {
                str = ast.lhs + ' = ' + unParseLine(ast.rhs);
            } else if ('seq' === ast.type) {
                str = _.map(ast.value, unParseLine).join(' ');
            } else if ('sum' === ast.type) {
                str = '[' + _.map(ast.value, unParseLine).join(', ') + ']';
            } else if ('ref' === ast.type) {
                str = ast.value;
            }

            for (var i = 1; i < ast.sustain; ++i) {
                str += ' ^';
            }

            return str;
        }
    };
});
