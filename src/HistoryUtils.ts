import * as _ from 'underscore';

/**
 * <ul>
 *     <li>newStateBuilder</li>
 * </ul>
 */
export class HistoryUtils {

  /**
   * Build a new state for history.pushState with no data but with same title and url
   *
   * <p>
   * Example :
   * </p>
   *
   * <pre>
   * HistoryUtils.newStateBuilder()
   *   .searchParam('page', '1')
   *   .searchParam('section', '1')
   *   .pushState();
   *
   * // Change only "section" param and nothing else
   * HistoryUtils.newStateBuilder()
   *   .searchParam('section', '2')
   *   .pushState();
   * </pre>
   *
   * @param data initial data (first param of history.pushState)
   * @see StateBuilder
   */
  static newStateBuilder(data?: any): StateBuilder {
    return new StateBuilder(data);
  }

  /**
   * pushState only if data is different than the current history.state
   * @param data initial data (first param of history.pushState)
   * @param initBuilder configure the stateBuilder built from data (see {@link HistoryUtils#newStateBuilder})
   * @return the final current state (the new one, or the old one if nothing has changed)
   */
  static pushStateOnlyNew(data: any, initBuilder?: (stateBuilder: StateBuilder) => StateBuilder): any {
    // New state data ?
    if (!_.isEqual(HistoryUtils.getState(), data)) {
      let stateBuilder = this.newStateBuilder(data);
      if (initBuilder) {
        stateBuilder = initBuilder(stateBuilder);
      }
      return stateBuilder.pushState();
    } else {
      return history.state;
    }
  }

  /**
   * Can be redefined to be sure to get previous/next state even when popState loses it
   */
  public static getState(): any {
    return history.state;
  }

  /**
   * @return attribute value of html/head/base/@href, '/' par défaut
   */
  static getBaseHref(): string {
    const bases = document.head.getElementsByTagName('base');
    if (!bases || !bases.length) {
      return '/';
    }
    const base = bases[0];
    return base.getAttribute('href') || '/';
  }
}

class StateBuilder {

  public state = {
    data: undefined,
    title: window.document.title,
    url: new URL(window.location.toString())
  };

  constructor(data?: any) {
    this.state.data = data;
  }

  /**
   * @param title document.title (2nd param of history.push)
   */
  title(title: string): StateBuilder {
    this.state.title = title;
    return this;
  }

  /**
   * @param name name of the searchParam in current window.location
   * @param value value of this searchParam in current window.location, delete the param if falsy
   */
  searchParam(name: string, value: any): StateBuilder {
    const searchParams = this.state.url.searchParams;
    if (value) {
      searchParams.set(name, value);
    } else {
      searchParams.delete(name);
    }
    return this;
  }

  /**
   * @param pathname relative or absolute, in this case base.href is added (example : "/page" will be interpreted as "/base/page")
   */
  pathname(pathname: string): StateBuilder {
    this.state.url.pathname = pathname.replace(/^\//, HistoryUtils.getBaseHref());
    return this;
  }

  /***
   * @see history.push
   */
  pushState(): any {
    history.pushState(this.state.data, this.state.title, this.state.url.toString());
    document.title = this.state.title; // https://stackoverflow.com/a/15261800/1655155
    console.log('HistoryUtils.pushState', this.state);
    return this.state.data;
  }
}
