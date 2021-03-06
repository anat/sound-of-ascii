/* global define, describe, it, beforeEach */

define(['chai', 'lib/song-generator'], function (chai, songGenerator) {

    var generator;

    beforeEach(function () {
        generator = new songGenerator.SongGenerator();
    });

    describe('The Song Generator', function () {

        it('should build atomic patterns', function () {
            generator.buildPattern('a').flatten().toString().should.equal('[a]');
        });

        it('should understand a quasi-terminal pattern definition like: Am = [a, c, e]', function () {
            generator.addLine('Am = [a, c, e]');
            generator.buildPattern('Am').flatten().toString().should.equal('[a, c, e]');
        });

        it('should understand sustain (atom case): Am = a ^', function () {
            generator.addLine('Am = a ^');
            generator.buildPattern('Am').flatten().toString().should.equal('[a ^]');
        });

        it('should understand sustain (indirect case): `Am = [a, c, e]` `Twice = Am ^`', function () {
            generator.addSource('Am = [a, c, e]\nTwice = Am ^');
            generator.buildPattern('Twice').flatten().toString().should.equal('[a ^, c ^, e ^]');
        });

        it('should understand a more complex pattern definition like: `Am = [a, c, e]` `Twice = Am Am`', function () {
            generator
                .addLine('Am = [a, c, e]')
                .addLine('Twice = Am Am')
            ;
            generator.buildPattern('Twice').flatten().toString().should.equal('[a a, c c, e e]');
        });

        it('should understand a multiline input', function () {
            generator.addSource('Am = [a, c, e]\nTwice = Am Am');
            generator.buildPattern('Twice').flatten().toString().should.equal('[a a, c c, e e]');
        });

        it('should tell me which is the @song pattern when defined', function () {
            generator.addLine('@song = TheSongPattern');
            generator.getSongPatternName().should.equal('TheSongPattern');
        });

        it('should yell if asked which is the @song pattern when undefined', function () {
            chai.expect(generator.getSongPatternName).to.throw();
        });

        it('should deduce the duration of an atom thanks to the @duration directive', function () {
            generator
                .addLine('Am = a b c d')
                .addLine('@duration(Am) = 4')
            ;
            generator.getAtomDuration().should.equal(1);
        });

        it('should yell if conflicting durations are declared', function () {
            generator
                .addLine('Am = [a, c, e]')
                .addLine('C = [c, e, g]')
                .addLine('@duration(Am) = 4')
                .addLine('@duration(C) = 2')
            ;
            chai.expect(generator.getAtomDuration).to.throw();
        });

        it('should yell if no duration is declared', function () {
            chai.expect(generator.getAtomDuration).to.throw();
        });
    });
});
