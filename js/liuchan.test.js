//const { LiuChan } = require('./liuchan');
import LiuChan from './liuchan';

const liuchan = new LiuChan();

// TODO --Write tests-- rewrite code to be unit testable -_-

test('returns results for a character search', () => {
    const search = '你好';
    expect(liuChan.dict.wordSearch(liuChan.dict.hanzi, search)).toEqual({})
});