import {AppPage} from './player.po';
import {browser, by, element, logging} from 'protractor';

describe('Player', () => {
  let page: AppPage;

  beforeEach(() => {
    page = new AppPage();
  });

  it('should display welcome message', () => {
    page.navigateTo().catch(() => {
      // Message de bienvenue
      const alert = browser.switchTo().alert();
      expect(alert.getText()).toContain('Bienvenue');
      alert.accept();
    });
  });

  it('should create disc from multitrack video', () => {
    page.navigateTo()
      .catch(async () => {
        await browser.switchTo().alert().accept();

        // On clique sur la création d'une nouvelle vidéo
        await element(by.id('createNewDisc')).click();

        // On saisi l'URL de la vidéo
        const alert = browser.switchTo().alert();
        alert.getText().then(text => console.log(text));
        await alert.sendKeys('https://www.youtube.com/watch?v=Dg0IjOzopYU'); // "Minecraft FULL SOUNDTRACK"
        await alert.accept();

        // Attente
        await browser.sleep(100);

        // Confirmer si on veut importer la playlist déjà existante depuis youtube-cues : on annule pour reconstruire le disque
        await browser.switchTo().alert().dismiss();

        // Attente pour être sûr que tout s'est bien passé
        await browser.sleep(10000);
      })
    ;
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));
  });
});
