const API_BASE = "http://localhost:3000";
document.addEventListener("DOMContentLoaded", function () {
  populerSecimleriGetir();
  const loginSection = document.getElementById("login-section");
  const voteSection = document.getElementById("vote-section");
  const resultSection = document.getElementById("result-section");
  const adminPanel = document.getElementById("admin-panel");
  const loginBtn = document.getElementById("login-btn");
  const adminLoginBtn = document.getElementById("admin-login-btn");
  const submitBtn = document.getElementById("submit-btn");
  const downloadExcelBtn = document.getElementById("download-excel");

  let girisYapanTc = "";
  let adminGiris = false;

  function showSection(section) {
    document.getElementById("login-section").classList.add("hidden");
    document.getElementById("vote-section").classList.add("hidden");
    document.getElementById("result-section").classList.add("hidden");
    section.classList.remove("hidden");
    // Sadece sonuçlar sayfasında #app gizlenir
  if (section.id === "result-section") {
    document.getElementById("app").style.display = "none";
  } else {
    document.getElementById("app").style.display = "block";
  }
}
  

  loginBtn.addEventListener("click", () => {
    const tc = document.getElementById("tc-input").value.trim();
    if (tc.length === 11 && /^\d+$/.test(tc)) {
      girisYapanTc = tc;
      localStorage.setItem("tc", tc);
      checkOyKullandiMi(tc);
    } else {
      alert("Geçerli bir TC Kimlik No giriniz.");
    }
  });

  adminLoginBtn.addEventListener("click", () => {
    const pass = document.getElementById("admin-password").value;
    if (pass === "admin45") {
      adminGiris = true;
      adminPanel.classList.remove("hidden");
      fetchVeGoster();
      showSection(resultSection);
    } else {
      alert("Hatalı şifre!");
    }
  });

  function checkOyKullandiMi(tc) {
    fetch(`${API_BASE}/api/kontrol?tc=${tc}`)
      .then(res => res.json())
      .then(data => {
        if (data.oyKullandi) {
          alert("Zaten oy kullandınız. Sonuçlar gösteriliyor.");
          fetchVeGoster();
          showSection(resultSection);
        } else {
          showSection(voteSection);
        }
      });
  }

  submitBtn.addEventListener("click", () => {
    const model = document.querySelector("input[name='model']:checked");
    const renk = document.querySelector("input[name='renk']:checked");
    const pantolon = document.querySelector("input[name='pantolon']:checked");

    if (!model || !renk || !pantolon) {
      alert("Tüm seçenekleri işaretleyiniz.");
      return;
    }

    const data = {
      tc: girisYapanTc,
      model: model.value,
      renk: renk.value,
      pantolon: pantolon.value
    };

    fetch(`${API_BASE}/api/oy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          alert("Oy başarıyla gönderildi!");
          fetchVeGoster();
          showSection(resultSection);
        } else {
          alert("Oy gönderilirken hata oluştu.");
        }
      });
  });

  function fetchVeGoster() {
    fetch(`${API_BASE}/api/sonuclar`)
      .then(res => res.json())
      .then(data => {
        cizGrafik("chartModel", data.model, "Tişört Modeli");
        cizGrafik("chartRenk", data.renk, "Tişört Rengi");
        cizGrafik("chartPantolon", data.pantolon, "Pantolon Rengi");
        // Tabloyu da oluştur
      tabloyuOlustur(data);
      });
  }

   

  function populerSecimleriGetir() {
  fetch(`${API_BASE}/api/sonuclar`)
    .then(res => res.json())
    .then(data => {
      if (!data || !data.model || !data.renk || !data.pantolon) {
        throw new Error("Eksik veri geldi");
      }

      function enCokTercih(veri) {
        return Object.entries(veri).reduce((max, item) => item[1] > max[1] ? item : max, ["-", -Infinity]);
      }

      const model = enCokTercih(data.model)[0];
      const renk = enCokTercih(data.renk)[0];
      const pantolon = enCokTercih(data.pantolon)[0];

      document.getElementById("populer-model").textContent = model;
      document.getElementById("populer-renk").textContent = renk;
      document.getElementById("populer-pantolon").textContent = pantolon;
    })
    .catch(err => {
      console.error("Popüler seçimler yüklenirken hata:", err);
      document.getElementById("populer-model").textContent = "Yüklenemedi";
      document.getElementById("populer-renk").textContent = "Yüklenemedi";
      document.getElementById("populer-pantolon").textContent = "Yüklenemedi";
    });
}




  function tabloyuOlustur(veri) {
  const tabloDiv = document.getElementById("sonuc-tablosu");

  const modelSiralama = Object.entries(veri.model).sort((a, b) => b[1] - a[1]);
  const renkSiralama = Object.entries(veri.renk).sort((a, b) => b[1] - a[1]);
  const pantolonSiralama = Object.entries(veri.pantolon).sort((a, b) => b[1] - a[1]);

  const tabloHTML = `
    <h3>Oy Dağılımı Tablosu (Büyükten Küçüğe)</h3>
    <table>
      <thead>
        <tr>
          <th>Kategori</th>
          <th>Seçenek</th>
          <th>Oy Sayısı</th>
        </tr>
      </thead>
      <tbody>
        ${modelSiralama.map(([secenek, sayi]) => `
          <tr class="kategori-model">
            <td>Tişört Modeli</td>
            <td>${secenek}</td>
            <td>${sayi}</td>
          </tr>`).join("")}
        ${renkSiralama.map(([secenek, sayi]) => `
          <tr class="kategori-renk">
            <td>Tişört Rengi</td>
            <td>${secenek}</td>
            <td>${sayi}</td>
          </tr>`).join("")}
        ${pantolonSiralama.map(([secenek, sayi]) => `
          <tr class="kategori-pantolon">
            <td>Pantolon Rengi</td>
            <td>${secenek}</td>
            <td>${sayi}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  `;

  tabloDiv.innerHTML = tabloHTML;
}




 function cizGrafik(canvasId, veriler, baslik) {
  const ctx = document.getElementById(canvasId).getContext("2d");

  // Etikete göre renk eşlemesi:
  const renkler = {
    "Beyaz": "#ffffff",
    "Siyah": "#000000",
    "Sarı": "#f1c40f",
    "Kırmızı": "#e74c3c",
    "Mavi": "#3498db",
    "Yeşil": "#2ecc71",
    "Turuncu": "#e67e22",
    "Gri": "#7f8c8d",
    "Füme": "#606060",
    "Polo Yaka": "#3498db",
    "Bisiklet Yaka": "#2ecc71"
  };

  const backgroundColors = Object.keys(veriler).map(label => renkler[label] || "#95a5a6");

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(veriler),
      datasets: [{
        data: Object.values(veriler),
        backgroundColor: backgroundColors
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: baslik
        },
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

  // Çıkış fonksiyonu
function cikisYap() {
  localStorage.removeItem("tc");
  girisYapanTc = "";
  adminGiris = false;
  // Ekranı girişe döndür
  showSection(loginSection);
  adminPanel.classList.add("hidden");
}

// Oy ve sonuç ekranındaki çıkış butonları
document.getElementById("logout-btn-vote").addEventListener("click", cikisYap);
document.getElementById("logout-btn-result").addEventListener("click", cikisYap);


    // downloadExcelBtn.addEventListener("click", () => {
    // window.location.href = `${API_BASE}/api/excel`;
    // });
});
