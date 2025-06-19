const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const ExcelJS = require("exceljs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect("mongodb+srv://admin:anket123@cluster0.jex5juo.mongodb.net/anketDB?retryWrites=true&w=majority&appName=Cluster0")
  .then(() => console.log("✅ MongoDB bağlantısı başarılı"))
  .catch(err => console.error("❌ MongoDB bağlantı hatası:", err));

const OySchema = new mongoose.Schema({
  tc: String,
  model: String,
  renk: String,
  pantolon: String
});
const Oy = mongoose.model("Oy", OySchema);

app.get("/api/kontrol", async (req, res) => {
  const tc = req.query.tc;
  const oy = await Oy.findOne({ tc });
  res.json({ oyKullandi: !!oy });
});

app.post("/api/oy", async (req, res) => {
  const { tc, model, renk, pantolon } = req.body;
  const mevcut = await Oy.findOne({ tc });
  if (mevcut) return res.json({ success: false });
  await Oy.create({ tc, model, renk, pantolon });
  res.json({ success: true });
});

app.get("/api/sonuclar", async (req, res) => {
  const oylar = await Oy.find();
  const model = {}, renk = {}, pantolon = {};
  oylar.forEach(oy => {
    model[oy.model] = (model[oy.model] || 0) + 1;
    renk[oy.renk] = (renk[oy.renk] || 0) + 1;
    pantolon[oy.pantolon] = (pantolon[oy.pantolon] || 0) + 1;
  });
  res.json({ model, renk, pantolon });
});

/* app.get("/api/excel", async (req, res) => {
  const oylar = await Oy.find();
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Oylar");
  sheet.columns = [
    { header: "Model", key: "model", width: 20 },
    { header: "Renk", key: "renk", width: 20 },
    { header: "Pantolon", key: "pantolon", width: 20 }
  ];
  oylar.forEach(oy => sheet.addRow(oy));
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=oylar.xlsx");
  await workbook.xlsx.write(res);
  res.end();
});*/

// Statik dosyaları sunuyoruz
app.use(express.static(path.join(__dirname)));

// Ana sayfa isteğinde index.html döndür
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server çalışıyor: http://localhost:${PORT}`);
});
