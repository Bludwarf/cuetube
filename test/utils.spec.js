

describe("utils", function() {

  it("should replace url param", function () {
    let src = "http://localhost:3000/player?collection=from";
    expect(setParameterByName('collection', 'to', src)).toEqual("http://localhost:3000/player?collection=to");
    expect(src).toEqual("http://localhost:3000/player?collection=from");

    src = "http://localhost:3000/player?collection=from&collection2=from2";
    expect(setParameterByName('collection', 'to', src)).toEqual("http://localhost:3000/player?collection=to&collection2=from2");

    src = "http://localhost:3000/player?collection1=from&collection2=from2";
    expect(setParameterByName('collection', 'to', src)).toEqual("http://localhost:3000/player?collection1=from&collection2=from2&collection=to");

    src = "http://localhost:3000/player";
    expect(setParameterByName('collection', 'to', src)).toEqual("http://localhost:3000/player?collection=to");

    const oldSearch = window.location.search;
    expect(window.location.search).toEqual(oldSearch);
  });

});