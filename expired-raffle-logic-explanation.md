# 🔄 Expired Raffle Handling Logic

## Auto-Finalization Process (`finalizeExpiredRaffles()`)

Finalizer her dakika bu fonksiyonu çağırıyor ve expired raffles'ları otomatik handle ediyor:

### **📋 3 Farklı Senaryo:**

---

### **1. 🎫 Hiç Bilet Satılmamış (ticketsSold = 0)**
```
IF: block.timestamp >= raffle.expirationTime && raffle.ticketsSold == 0
THEN: _cancelRaffleInternal(raffleId)
```

**Ne Oluyor:**
- ✅ Raffle status → `CANCELLED`
- ✅ Reward → Creator'a geri döner (MON/Token/NFT)
- ✅ Active raffles listesinden çıkarılır
- ✅ `RaffleCancelled` event emit edilir

**Sonuç:** Creator'ın hiçbir kaybı yok, reward'ı geri alır.

---

### **2. 🎯 Bilet Satılmış, Randomness Commit Edilmemiş**
```
IF: block.timestamp >= raffle.expirationTime && raffle.ticketsSold > 0 && no randomness
THEN: _commitRandomnessForRaffle(raffleId)
```

**Ne Oluyor:**
- ✅ Randomness commitment oluşturulur
- ✅ 2 dakikalık reveal window başlar
- ⏰ Reveal deadline geçince → Emergency winner selection

**Sonuç:** Normal raffle flow'una girer, winner seçilir.

---

### **3. 🎲 Bilet Satılmış, Randomness Zaten Commit Edilmiş**
```
IF: block.timestamp >= raffle.expirationTime && raffle.ticketsSold > 0 && randomness exists
THEN: Skip (already handled, waiting for reveal/emergency)
```

**Ne Oluyor:**
- ⏳ Reveal window beklenir
- ⏰ Deadline geçince → `emergencySelectWinner()` çağrılır
- ✅ Winner otomatik seçilir ve reward dağıtılır

---

## **🤖 Finalizer Süreci:**

### **Adım 0: Auto-Finalize**
```javascript
// Her dakika çalışır
try {
  await contract.finalizeExpiredRaffles()
  // Max 10 expired raffle işler (gas limit için)
} catch (error) {
  // No expired raffles varsa error, normal
}
```

### **Adım 1: Commitment Check**
- Sold out ama commitment olmayan raffles'ı bulur
- `commitRandomnessForExpiredRaffle()` çağırır

### **Adım 2: Emergency Selection**
- Reveal deadline geçmiş raffles'ı bulur  
- `emergencySelectWinner()` çağırır
- Winner otomatik seçilir ve reward dağıtılır

---

## **📊 Örnek Senaryolar:**

### **Senaryo A: Boş Raffle**
```
Raffle: "10 MON ödüllü raffle"
Tickets: 0 sold
Expired: ✅
Result: 10 MON creator'a geri döner
```

### **Senaryo B: Yarı Dolu Raffle**  
```
Raffle: "NFT ödüllü raffle" 
Tickets: 5/20 sold
Expired: ✅
Result: 5 ticket alandan biri kazanır, NFT'i alır
```

### **Senaryo C: Sold Out Raffle**
```
Raffle: "5 MON ödüllü raffle"
Tickets: 20/20 sold (FULL)
Result: Sold out olur olmaz winner seçilir (expire beklemez)
```

---

## **⚡ Artıklar:**

- **Gas Optimized:** Max 10 raffle/call (infinite loop engeller)
- **Fail Safe:** Her adım try-catch ile korunmuş
- **Event Logging:** Tüm actions event ile loglanır
- **Creator Protection:** Hiçbir zaman creator zarar görmez
- **User Protection:** Ticket alanlar her zaman şansını alır

Bu sistem artık tamamen otomatik! 🎉 