import { HistoryUtils } from './HistoryUtils';

describe('HistoryUtils', () => {

  beforeEach(() => {
    HistoryUtils.newStateBuilder()
      .pathname('/page1')
      .searchParam('collection', 'collection1')
      .searchParam('token', 'important')
      .pushState();

    const expected = expect(location.toString());
    expected.toContain('/page1?');
    expected.toContain('collection=collection1');
    expected.toContain('token=important');
  });

  it('should replace only one param', () => {
    HistoryUtils.newStateBuilder()
      .searchParam('collection', 'collection2')
      .pushState();

    const expected = expect(location.toString());
    expected.toContain('collection=collection2');
    expected.toContain('token=important');
  });

  it('should change page but not params', () => {
    HistoryUtils.newStateBuilder()
      .pathname('/page2')
      .pushState();

    const expected = expect(location.toString());
    expected.toContain('/page2?');
    expected.toContain('collection=collection1');
    expected.toContain('token=important');

    // TODO ajouter méthode resetSearchParams
  });

  it('should URL encode params', () => {
    HistoryUtils.newStateBuilder()
      .searchParam('list', 'item1,item2')
      .pushState();

    const expected = expect(location.toString());
    expected.toContain('list=' + encodeURIComponent('item1,item2'));
  });

  it('should add array param', () => {
    HistoryUtils.newStateBuilder()
      .searchParam('array', ['item1', 'item2'])
      .pushState();

    const expected = expect(location.toString());
    expected.toContain('array=' + encodeURIComponent('item1,item2'));
  });
});
