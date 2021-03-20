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

    const mapper5 = new Mapper({
        fields: [{
            from: 'a',
            to: 'b',
            disableSerialize: true,
        }, {
            from: 'c',
            to: 'd',
            disableDeserialize: true,
        }]
    });

    it('should allow basic serialization', function() {
        const aVal = 10;
        const dto = mapper1.serialize({a: aVal});
        expect(dto).property('a').to.equal(aVal);
    });

    it('should allow basic single property serialization', function() {
        const aVal = 10;
        const serialized = mapper1.serializeField('a', aVal);
        expect(serialized).equal(10);
        const serializedAndUnmapped = mapper1.serializeAndUnmapField('a', aVal);
        expect(serializedAndUnmapped).property('key').to.equal('a');
        expect(serializedAndUnmapped).property('value').to.equal(10);
    });

    it('should allow basic deserialization', function() {
        const aVal = 10;
        const entity = mapper1.deserialize({a: aVal});
        expect(entity).property('a').to.equal(aVal);
    });

    it('should allow basic single property deserialization', function() {
        const aVal = 10;
        const deserialized = mapper1.deserializeField('a', aVal);
        expect(deserialized).equal(10);
        const deserializedAndMapped = mapper1.deserializeAndMapField('a', aVal);
        expect(deserializedAndMapped).property('key').to.equal('a');
        expect(deserializedAndMapped).property('value').to.equal(10);
    });

    it('should allow renaming properties', function() {
        const val = 10;
        const dto = mapper2.serialize({b: val});
        expect(dto).property('a').to.equal(val);
        const entity = mapper2.deserialize({a: val});
        expect(entity).property('b').to.equal(val);
    });

    it('should allow renaming in single property (de)serialization', function() {
        const val = 10;
        const serialized = mapper2.serializeField('b', val);
        expect(serialized).equal(10);
        const serializedAndUnmapped = mapper2.serializeAndUnmapField('b', val);
        expect(serializedAndUnmapped).property('key').to.equal('a');
        expect(serializedAndUnmapped).property('value').to.equal(10);
        const deserialized = mapper2.deserializeField('a', val);
        expect(deserialized).equal(10);
        const deserializedAndMapped = mapper2.deserializeAndMapField('a', val);
        expect(deserializedAndMapped).property('key').to.equal('b');
        expect(deserializedAndMapped).property('value').to.equal(10);
    });

    it('should respect scopes', function() {
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


    it('should allow transforming the data', function() {
        const val = 10;
        const dto = mapper4.serialize({b: val});
        expect(dto.a).to.equal(5);
        const entity = mapper4.deserialize({a: val});
        expect(entity.b).to.equal(20);
    });

    it('should allow resolving one key mapping', function() {
        expect(mapper2.unmapKey('b')).to.equal('a');
    });

    it('should allow resolving one reverse key mapping', function() {
        expect(mapper2.mapKey('a')).to.equal('b');
    });

    it('should allow disabling serialization', function() {
        const dto = mapper5.serialize({
            b: 1,
            d: 2,
        });
        expect(dto.a).to.be.undefined;
        expect(dto.c).to.be.equal(2);
    });

    it('should allow disabling deserialization', function() {
        const entity = mapper5.deserialize({
            a: 1,
            c: 2,
        });
        expect(entity.b).to.be.equal(1);
        expect(entity.d).to.be.undefined;
    });

    it('should handle null', function() {
        const dto = mapper1.serialize(null);
        expect(dto).to.be.null;
        const entity = mapper1.deserialize(null);
        expect(entity).to.be.null;
    });

    it('should handle undefined', function() {
        const dto = mapper1.serialize(undefined);
        expect(dto).to.be.undefined;
        const entity = mapper1.deserialize(undefined);
        expect(entity).to.be.undefined;
    });
});
