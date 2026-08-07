package com.ladybot.service;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Service
public class FacebookService {
    private WebDriver driver;

    // 🛍️ Páginas exclusivas para Ofertas
    private final List<String> PAGINAS_OFERTAS = Arrays.asList(
            "https://www.facebook.com/DescuentosVirales2025/",
            "https://www.facebook.com/profile.php?id=61582079383801"
    );

    // 🕊️ Página exclusiva para La Biblia
    private final String PAGINA_BIBLIA = "https://www.facebook.com/profile.php?id=61589344075596";

    private void pausaHumana(int minSegundos, int maxSegundos) {
        try {
            long pausa = (long) (Math.random() * (maxSegundos - minSegundos + 1) + minSegundos) * 1000;
            Thread.sleep(pausa);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private void scrollHumano() {
        try {
            JavascriptExecutor js = (JavascriptExecutor) driver;
            js.executeScript("window.scrollBy(0, " + (Math.random() * 300 + 100) + ");");
            pausaHumana(1, 3);
            js.executeScript("window.scrollBy(0, " + -(Math.random() * 150) + ");");
            pausaHumana(1, 2);
        } catch (Exception e) {}
    }

    public synchronized void inicializarSesion() {
        System.out.println("--- 📱 LadyBot [FB]: Abriendo Facebook para INICIAR SESIÓN MANUAL. Tienes 2 minutos... ---");
        configurarNavegador();
        try {
            driver.get("https://www.facebook.com/");
            Thread.sleep(120000);
            System.out.println("--- 📱 LadyBot [FB]: Tiempo agotado. Sesión maestra guardada en la caché. ---");
        } catch (Exception e) {
            System.err.println("--- ❌ Error en vinculación inicial FB ---");
        } finally {
            if (driver != null) { driver.quit(); driver = null; }
        }
    }

    // 🛍️ MÉTODO PARA PUBLICAR OFERTAS
    public synchronized void enviarMensajeOferta(String mensajeFormatoTelegram) {
        String mensajeFB = limpiarFormato(mensajeFormatoTelegram);
        configurarNavegador();
        try {
            for (String pagina : PAGINAS_OFERTAS) {
                WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(30));
                System.out.println("--- LadyBot [FB]: Aterrizando en " + pagina + " para publicar OFERTA (Texto)... ---");
                driver.get(pagina);
                pausaHumana(6, 10);
                if (checkSessionLost()) return;
                scrollHumano();
                manejarCambioPerfil();
                hacerPostTextoPure(wait, mensajeFB);
            }
        } finally {
            if (driver != null) { driver.quit(); driver = null; }
        }
    }

    // 🕊️ MÉTODO PARA PUBLICAR CONTENIDO RELIGIOSO (SOLO TEXTO AHORA)
    public synchronized void enviarMensajeBibliaSoloTexto(String mensajeFormatoTelegram) {
        String mensajeFB = limpiarFormato(mensajeFormatoTelegram);
        configurarNavegador();
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(30));
        try {
            System.out.println("--- LadyBot [FB]: Aterrizando en La Biblia para publicar SOLO TEXTO ---");
            driver.get(PAGINA_BIBLIA);
            pausaHumana(6, 10);
            if (checkSessionLost()) return;
            scrollHumano();
            manejarCambioPerfil();

            // Reutilizamos el método de publicación de texto que ya funciona bien
            hacerPostTextoPure(wait, mensajeFB);

        } catch (Exception e) {
            System.err.println("--- ❌ Error al publicar en La Biblia: " + e.getMessage() + " ---");
        } finally {
            if (driver != null) { driver.quit(); driver = null; }
        }
    }

    // --- MÉTODOS PRIVADOS DE LÓGICA SELENIUM ---

    private void hacerPostTextoPure(WebDriverWait wait, String mensaje) {
        try {
            WebElement btnPensando = wait.until(ExpectedConditions.presenceOfElementLocated(
                    By.xpath("//*[contains(text(), 'pensando') or contains(text(), 'Escribe algo')]")
            ));
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", btnPensando);

            WebElement chatBox = wait.until(ExpectedConditions.presenceOfElementLocated(
                    By.xpath("//form[@method='POST']//div[@contenteditable='true']")
            ));
            new Actions(driver).moveToElement(chatBox).click().sendKeys(mensaje).perform();

            pausaHumana(10, 14); // Esperar que facebook procese si hay algun link
            clickFinalesPublish();
        } catch (Exception e) {
            System.err.println("--- ❌ Error haciendo el post de texto: " + e.getMessage());
        }
    }

    // --- UTILIDADES ---

    private boolean checkSessionLost() {
        if (!driver.findElements(By.xpath("//input[@name='email' or @id='email']")).isEmpty()) {
            System.err.println("--- 🚨 ALERTA FB: Facebook cerró la sesión maestra. ---");
            return true;
        }
        return false;
    }

    private void manejarCambioPerfil() {
        try {
            List<WebElement> botonesCambiar = driver.findElements(By.xpath("//div[@role='button']//*[contains(text(), 'Cambiar') or contains(text(), 'Switch')]"));
            if (!botonesCambiar.isEmpty()) {
                ((JavascriptExecutor) driver).executeScript("arguments[0].click();", botonesCambiar.get(0));
                Thread.sleep(3000);
                List<WebElement> botonesConfirmar = driver.findElements(By.xpath("//div[@role='dialog']//div[@role='button']//*[contains(text(), 'Cambiar') or contains(text(), 'Switch')]"));
                if (!botonesConfirmar.isEmpty()) {
                    ((JavascriptExecutor) driver).executeScript("arguments[0].click();", botonesConfirmar.get(0));
                }
                Thread.sleep(6000);
            }
        } catch (Exception ignored) {}
    }

    private void clickFinalesPublish() throws InterruptedException {
        try {
            WebElement btnSiguiente = driver.findElement(By.xpath("//div[@role='dialog']//div[@aria-label='Siguiente']"));
            ((JavascriptExecutor) driver).executeScript("arguments[0].click();", btnSiguiente);
            Thread.sleep(4000);
        } catch (Exception ignored) {}

        String[] selectoresPublicar = {
                "//div[@aria-label='Publicar']",
                "//span[text()='Publicar']/ancestor::div[@role='button']"
        };
        boolean clickExitoso = false;
        for (int intentos = 0; intentos < 2; intentos++) {
            for (String selector : selectoresPublicar) {
                try {
                    WebElement btnPublicar = driver.findElement(By.xpath(selector));
                    if ("true".equals(btnPublicar.getAttribute("aria-disabled"))) Thread.sleep(3000);
                    pausaHumana(2, 4);
                    ((JavascriptExecutor) driver).executeScript("arguments[0].click();", btnPublicar);
                    clickExitoso = true; break;
                } catch (Exception ignored) {}
            }
            if (clickExitoso) break;
            Thread.sleep(2000);
        }
        if(clickExitoso) System.out.println("--- ✅ Publicación exitosa en FB ---");
    }

    private String limpiarFormato(String texto) {
        return texto.replace("<b>", "").replace("</b>", "").replace("<i>", "").replace("</i>", "");
    }

    private void configurarNavegador() {
        if (driver == null) {
            WebDriverManager.chromedriver().setup();
            ChromeOptions o = new ChromeOptions();
            o.addArguments("--remote-allow-origins=*", "user-data-dir=C:/Users/Administrator/LadyBot_FBSession_Master");
            o.addArguments("--start-maximized", "--disable-notifications");
            o.addArguments("--disable-blink-features=AutomationControlled");
            o.setExperimentalOption("excludeSwitches", Collections.singletonList("enable-automation"));
            o.setExperimentalOption("useAutomationExtension", false);
            this.driver = new ChromeDriver(o);
        }
    }
}
