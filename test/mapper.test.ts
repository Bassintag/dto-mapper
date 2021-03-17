import {expect} from 'chai';
import {Mapper} from '../src';

describe('Mapper class', () => {

    const mapper1 = new Mapper({
        fields: [{
            from: 'a',
            to: 'a',
        }],
    });

    const mapper2 = new Mapper({
        fields: [{
            from: 'a',
            to: 'b',
        }],
    });

    const mapper3 = new Mapper({
        fields: [{
            from: 'a',
            to: 'b',
        }, {
            from: 'c',
            to: 'd',
            scopes: ['admin'],
        }],
    });

    const mapper4 = new Mapper({
        fields: [{
            from: 'a',
            to: 'b',
            transformer: {
                fromDto: (d) => d * 2,
                toDto: (d) => d / 2,
            },
        }],
    });

    it('should allow basic serialization', function () {
        const aVal = 10;
        const dto = mapper1.serialize({a: aVal});
        expect(dto).property('a').to.equal(aVal);
    });

    it('should allow basic single property serialization', function () {
        const aVal = 10;
        const serialized = mapper1.serializeField('a', aVal);
        expect(serialized.key).equal('a');
        expect(serialized.value).equal(aVal);
    });

    it('should allow basic deserialization', function () {
        const aVal = 10;
        const entity = mapper1.deserialize({a: aVal});
        expect(entity).property('a').to.equal(aVal);
    });

    it('should allow basic single property deserialization', function () {
        const aVal = 10;
        const deserialized = mapper1.deserializeField('a', aVal);
        expect(deserialized.key).equal('a');
        expect(deserialized.value).equal(aVal);
    });

    it('should allow renaming properties', function () {
        const val = 10;
        const dto = mapper2.serialize({b: val});
        expect(dto).property('a').to.equal(val);
        const entity = mapper2.deserialize({a: val});
        expect(entity).property('b').to.equal(val);
    });

    it('should allow renaming in single property (de)serialization', function () {
        const val = 10;
        const serialized = mapper2.serializeField('b', val);
        expect(serialized.key).equal('a');
        expect(serialized.value).equal(val);
        const deserialized = mapper2.deserializeField('a', val);
        expect(deserialized.key).equal('b');
        expect(deserialized.value).equal(val);
    });

    it('should respect scopes', function () {
        const val1 = 10;
        const val2 = 'secret';
        const dto = mapper3.serialize({b: val1, d: val2});
        expect(dto).property('a').to.equal(val1);
        expect(dto.c).to.be.undefined;
        const entity = mapper3.deserialize({a: val1, c: val2});
        expect(entity).property('b').to.equal(val1);
        expect(entity.d).to.be.undefined;
        const dtoAdmin = mapper3.serialize({b: val1, d: val2}, 'admin');
        expect(dtoAdmin).property('a').to.equal(val1);
        expect(dtoAdmin).property('c').to.be.equal(val2);
        const entityAdmin = mapper3.deserialize({a: val1, c: val2}, 'admin');
        expect(entityAdmin).property('b').to.equal(val1);
        expect(entityAdmin).property('d').to.equal(val2);
    });


    it('should allow transforming the data', function () {
        const val = 10;
        const dto = mapper4.serialize({b: val});
        expect(dto.a).to.equal(5);
        const entity = mapper4.deserialize({a: val});
        expect(entity.b).to.equal(20);
    });
})