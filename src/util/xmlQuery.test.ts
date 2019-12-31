import xmlQuery from './xmlQuery';
import { Element } from 'xml-js';

test('wrapping an element adds new properties and functions', () => {
    const el: Element = {
        type: 'element',
        name: 'foo',
    };
    const node = xmlQuery(el);

    expect(node).toMatchObject({
        ...el,
        originalNode: el,
    });
});

test('returns an already wrapped instance directly', () => {
    const el: Element = {
        type: 'element',
        name: 'foo',
    };
    const node = xmlQuery(el);

    expect(xmlQuery(node)).toBe(node);
});

test('returns wrapped instance for primitive', () => {
    expect(xmlQuery(undefined)).toMatchObject({
        originalNode: undefined,
        elements: [],
        attributes: {},
    });
    expect(xmlQuery('foobar')).toMatchObject({
        originalNode: 'foobar',
        elements: [],
        attributes: {},
    });
    expect(xmlQuery(123)).toMatchObject({
        originalNode: 123,
        elements: [],
        attributes: {},
    });
});

describe('handles arrays of Elements correctly', () => {
    const elements = [{
        type: 'element',
        name: 'foo',
        elements: [{
            type: 'element',
            name: 'first',
        }, {
            type: 'text',
            text: 'inner',
        }],
    }, {
        type: 'element',
        name: 'bar',
        elements: [{
            type: 'element',
            name: 'second',
        }, {
            type: 'text',
            text: 'inner2',
        }],
    }, {
        type: 'element',
        name: 'baz',
        elements: [{
            type: 'element',
            name: 'third',
        }],
    }, {
        type: 'text',
        text: 'outer',
    }];

    test('wraps arrays of Elements correctly', () => {
        const node = xmlQuery(elements);

        expect(node.name).toBeUndefined();
        expect(node.originalNode).toBe(elements);
        expect(node.elements).toHaveLength(4);
        expect(node.elements).toMatchObject<Element[]>([
            {
                type: 'element',
                name: 'foo',
            },
            {
                type: 'element',
                name: 'bar',
            },
            {
                type: 'element',
                name: 'baz',
            },
            {
                type: 'text',
                text: 'outer',
            },
        ]);
    });

    test('innerElements on array of elements', () => {
        const node = xmlQuery(elements);
        expect(node.innerElements()).toEqual([{
            type: 'element',
            name: 'first',
        }, {
            type: 'text',
            text: 'inner',
        }, {
            type: 'element',
            name: 'second',
        }, {
            type: 'text',
            text: 'inner2',
        }, {
            type: 'element',
            name: 'third',
        }]);
    });

    test('innerText on array of elements', () => {
        const node = xmlQuery(elements);
        expect(node.innerText()).toBe('innerinner2');
    });

    test('query on array of elements', () => {
        const node = xmlQuery(elements);
        const expectedElement = {
            type: 'element',
            name: 'first',
        };

        expect(node.query('first')).toMatchObject(expectedElement);
        expect(node.query(0)).toMatchObject(expectedElement);
        expect(node.query(node => node.name === 'first')).toMatchObject(expectedElement);
    });

    test('queryAll on array of elements', () => {
        const node = xmlQuery(elements);
        const expectedElements = {
            elements: [{
                type: 'element',
                name: 'first',
            }]
        };

        expect(node.queryAll('first')).toMatchObject(expectedElements);
        expect(node.queryAll(0)).toMatchObject(expectedElements);
        expect(node.queryAll(node => node.name === 'first')).toMatchObject(expectedElements);
    });

    test('forEach on array of elements', () => {
        const node = xmlQuery(elements);

        node.forEach((el, index) => {
            expect(el).toMatchObject(elements[index]);
        });
    });

    test('map on array of elements', () => {
        const node = xmlQuery(elements);
        const result = node.map((el, index) => {
            expect(el).toMatchObject(elements[index]);
            return el.name;
        });
        const resultExpected = ['foo', 'bar', 'baz', undefined];
        expect(result.originalNode).toEqual(resultExpected);
        expect(result.elements).toEqual(resultExpected);

        const result2 = node.map((el, index) => {
            expect(el).toMatchObject(elements[index]);
            return el.elements![0];
        });
        const result2Expected = [
            { type: 'element', name: 'first' },
            { type: 'element', name: 'second' },
            { type: 'element', name: 'third' },
            undefined,
        ];
        expect(result2.originalNode).toEqual(result2Expected);
        expect(result2.elements).toEqual(result2Expected);
    });
});

describe('handles single Elements correctly', () => {
    const element = {
        type: 'element',
        name: 'outer',
        elements: [{
            type: 'element',
            name: 'inner',
            elements: [{
                type: 'element',
                name: 'deep inner',
            }],
        }, {
            type: 'text',
            text: 'wubba lubba dub dub',
        }],
    };

    test('wraps element correctly', () => {
        const node = xmlQuery(element);

        expect(node.name).toBe('outer');
        expect(node.originalNode).toBe(element);
        expect(node.elements).toHaveLength(2);
        expect(node.elements).toMatchObject<Element[]>([{
            type: 'element',
            name: 'inner',
        }, {
            type: 'text',
            text: 'wubba lubba dub dub',
        }]);
    });

    test('innerElements on element', () => {
        const node = xmlQuery(element);
        expect(node.innerElements()).toEqual([{
            type: 'element',
            name: 'inner',
            elements: [{
                type: 'element',
                name: 'deep inner',
            }],
        }, {
            type: 'text',
            text: 'wubba lubba dub dub',
        }]);
    });

    test('innerText on element', () => {
        const node = xmlQuery(element);
        expect(node.innerText()).toBe('wubba lubba dub dub');
    });

    test('query on element', () => {
        const node = xmlQuery(element);
        const expectedElement = {
            type: 'element',
            name: 'inner',
        };

        expect(node.query('inner')).toMatchObject(expectedElement);
        expect(node.query(0)).toMatchObject(expectedElement);
        expect(node.query(node => node.name === 'inner')).toMatchObject(expectedElement);
    });

    test('queryAll on element', () => {
        const node = xmlQuery(element);
        const expectedElements = {
            elements: [{
                type: 'element',
                name: 'inner',
            }]
        };

        expect(node.queryAll('inner')).toMatchObject(expectedElements);
        expect(node.queryAll(0)).toMatchObject(expectedElements);
        expect(node.queryAll(node => node.name === 'inner')).toMatchObject(expectedElements);
    });

    test('forEach on element', () => {
        const node = xmlQuery(element);

        node.forEach((el, index) => {
            expect(el).toMatchObject(element.elements[index]);
        });
    });

    test('map on element', () => {
        const node = xmlQuery(element);
        const result = node.map((el, index) => {
            expect(el).toMatchObject(element.elements[index]);
            return el.name;
        });
        const resultExpected = ['inner', undefined];
        expect(result.originalNode).toEqual(resultExpected);
        expect(result.elements).toEqual(resultExpected);

        const result2 = node.map((el, index) => {
            expect(el).toMatchObject(element.elements[index]);
            return el.elements![0];
        });
        const result2Expected = [
            { type: 'element', name: 'deep inner' },
            undefined,
        ];
        expect(result2.originalNode).toEqual(result2Expected);
        expect(result2.elements).toEqual(result2Expected);
    });
});