# يومي — واجهة Electron

واجهة سطح مكتب عربية باتجاه RTL باستخدام React وTypeScript وElectron. النسخة تحفظ المهام تلقائيًا على الجهاز باستخدام التخزين المحلي. يمكنك إضافة المهام وتعديلها وحذفها وإنجازها، وكتابة تفاصيلها، وتحديد التصنيف والأولوية وتاريخ ووقت الاستحقاق، ثم البحث والتصفية. تبقى المهام بعد إغلاق التطبيق وفتحه من جديد؛ لا يوجد حساب أو مزامنة سحابية.

## المتطلبات
- Node.js LTS (يتضمن npm)

## تشغيل الواجهة في المتصفح
```powershell
npm install
npm run dev
```

## تشغيل نافذة سطح المكتب
```powershell
npm install
npm run desktop
```

## إنشاء مُثبّت ويندوز
```powershell
npm install
npm run package:win
```
سيظهر المثبت داخل مجلد `release` بعد اكتمال البناء.

## إنشاء تطبيق ويندوز مع أيقونة واختصار
من PowerShell داخل مجلد المشروع:

```powershell
npm install
npm run package:win
```

سينتج ملف تثبيت باسم `Yawmi-Setup-1.0.0.exe` داخل `release`. شغّل الملف وثبّت التطبيق؛ سينشئ التثبيت اختصارًا على سطح المكتب وفي قائمة Start. الأيقونة المستخدمة موجودة في `build/yawmi.ico`.

إذا ظهر خطأ أن Electron لم يثبت بشكل صحيح، نفّذ مرة واحدة:

```powershell
node .\node_modules\electron\install.js
```

ثم أعد `npm run package:win`.
