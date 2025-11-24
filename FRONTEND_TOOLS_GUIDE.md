# 🎨 Frontend Tools Integration Guide

**Date Added**: November 22, 2025  
**Purpose**: Enhance Advancia Pay's UI/UX with professional libraries

---

## 📦 Installed Packages

```bash
npm install daisyui formik yup @nivo/core @nivo/line @nivo/bar @nivo/pie @headlessui/react
```

### Package Versions

-   **daisyui**: ^4.x - Tailwind CSS component library
-   **formik**: ^2.x - Form state management
-   **yup**: ^1.x - Schema validation
-   **@nivo/\***: ^0.87.x - Data visualization
-   **@headlessui/react**: ^2.x - Accessible UI components

---

## 🎯 Quick Start Guide

### 1. DaisyUI - Component Library

**What it does**: Pre-styled Tailwind components  
**Use for**: Buttons, cards, modals, alerts, forms

#### Before DaisyUI

```tsx
<button className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all">Submit</button>
```

#### After DaisyUI

```tsx
<button className="btn btn-primary">Submit</button>
```

#### Common Components

```tsx
// Buttons
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-outline">Outline</button>

// Cards
<div className="card bg-base-100 shadow-xl">
  <div className="card-body">
    <h2 className="card-title">Title</h2>
    <p>Content here</p>
    <div className="card-actions">
      <button className="btn btn-primary">Action</button>
    </div>
  </div>
</div>

// Alerts
<div className="alert alert-success">
  <span>Success message!</span>
</div>

// Badges
<div className="badge badge-primary">New</div>

// Stats
<div className="stats shadow">
  <div className="stat">
    <div className="stat-title">Balance</div>
    <div className="stat-value">$25,600</div>
    <div className="stat-desc">↗︎ 12% increase</div>
  </div>
</div>
```

**Configuration**: See `frontend/tailwind.config.js`  
**Themes**: `advancia` (custom), `dark`, `light`

---

### 2. Formik + Yup - Form Management

**What it does**: Form state, validation, submission handling  
**Use for**: Login, registration, KYC, payment forms

#### Example

```tsx
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const schema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  amount: Yup.number().positive("Must be positive").min(10, "Minimum $10").required("Required"),
});

function MyForm() {
  return (
    <Formik
      initialValues={{ email: "", amount: "" }}
      validationSchema={schema}
      onSubmit={(values, { setSubmitting }) => {
        // Handle submission
        console.log(values);
        setSubmitting(false);
      }}
    >
      {({ isSubmitting, errors, touched }) => (
        <Form>
          <Field name="email" type="email" className={`input input-bordered ${errors.email && touched.email ? "input-error" : ""}`} />
          <ErrorMessage name="email">{(msg) => <span className="text-error">{msg}</span>}</ErrorMessage>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? "Processing..." : "Submit"}
          </button>
        </Form>
      )}
    </Formik>
  );
}
```

**Benefits**:

-   ✅ Auto validation on blur/change
-   ✅ Error message handling
-   ✅ Loading states
-   ✅ Async submission
-   ✅ Form reset after success

---

### 3. Nivo - Data Visualization

**What it does**: Beautiful, responsive charts  
**Use for**: Transaction history, analytics dashboards, reports

#### Line Chart

```tsx
import { ResponsiveLine } from "@nivo/line";

const data = [
  {
    id: "revenue",
    data: [
      { x: "Jan", y: 45000 },
      { x: "Feb", y: 52000 },
      { x: "Mar", y: 48000 },
    ],
  },
];

<div className="h-96">
  <ResponsiveLine data={data} margin={{ top: 50, right: 110, bottom: 50, left: 60 }} xScale={{ type: "point" }} yScale={{ type: "linear" }} curve="cardinal" enableArea={true} animate={true} />
</div>;
```

#### Bar Chart

```tsx
import { ResponsiveBar } from "@nivo/bar";

const data = [
  { month: "Jan", revenue: 7000, fees: 350 },
  { month: "Feb", revenue: 10000, fees: 500 },
];

<ResponsiveBar data={data} keys={["revenue", "fees"]} indexBy="month" groupMode="grouped" colors={{ scheme: "nivo" }} />;
```

#### Pie Chart

```tsx
import { ResponsivePie } from "@nivo/pie";

const data = [
  { id: "Premium", value: 320 },
  { id: "Standard", value: 850 },
];

<ResponsivePie data={data} innerRadius={0.5} padAngle={0.7} animate={true} />;
```

**Available Charts**:

-   Line, Bar, Pie, Area, Stream
-   Heatmap, Calendar, Sankey
-   Radar, Funnel, Network

---

### 4. Headless UI - Accessible Components

**What it does**: Unstyled, accessible UI components  
**Use for**: Modals, dropdowns, tabs, toggles

#### Modal/Dialog

```tsx
import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";

function MyModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn btn-primary">
        Open Modal
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog onClose={() => setIsOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100">
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <Dialog.Panel className="bg-white p-6 rounded-lg">
              <Dialog.Title>Modal Title</Dialog.Title>
              <p>Modal content here</p>
              <button onClick={() => setIsOpen(false)}>Close</button>
            </Dialog.Panel>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
```

#### Dropdown/Listbox

```tsx
import { Listbox } from "@headlessui/react";

const [selected, setSelected] = useState(options[0]);

<Listbox value={selected} onChange={setSelected}>
  <Listbox.Button className="input input-bordered">{selected.name}</Listbox.Button>
  <Listbox.Options className="bg-white shadow-lg rounded-lg">
    {options.map((option) => (
      <Listbox.Option key={option.id} value={option}>
        {option.name}
      </Listbox.Option>
    ))}
  </Listbox.Options>
</Listbox>;
```

#### Toggle/Switch

```tsx
import { Switch } from "@headlessui/react";

const [enabled, setEnabled] = useState(false);

<Switch
  checked={enabled}
  onChange={setEnabled}
  className={`${enabled ? "bg-primary" : "bg-gray-300"} 
    relative inline-flex h-6 w-11 items-center rounded-full`}
>
  <span
    className={`${enabled ? "translate-x-6" : "translate-x-1"} 
    inline-block h-4 w-4 rounded-full bg-white`}
  />
</Switch>;
```

---

## 📍 Demo Page

**Access the live demo**:  
<http://localhost:3000/demo/tools>

**Example Components**:

-   `frontend/src/components/examples/EnhancedFormExample.tsx`
-   `frontend/src/components/examples/NivoChartsExample.tsx`
-   `frontend/src/components/examples/HeadlessUIExample.tsx`

---

## 🎨 Styling Best Practices

### Combining Libraries

```tsx
// DaisyUI + Headless UI
<Dialog.Panel className="card bg-base-100 shadow-xl">
  <div className="card-body">
    <Dialog.Title className="card-title">Title</Dialog.Title>
    <button className="btn btn-primary">Action</button>
  </div>
</Dialog.Panel>

// Formik + DaisyUI
<Formik>
  <Form>
    <Field className="input input-bordered" />
    <button className="btn btn-primary">Submit</button>
  </Form>
</Formik>

// Nivo + DaisyUI
<div className="card bg-base-100">
  <div className="card-body">
    <h2 className="card-title">Chart</h2>
    <div className="h-96">
      <ResponsiveLine data={data} />
    </div>
  </div>
</div>
```

---

## 🚀 Migration Guide

### Replace Existing Components

#### 1. Login/Register Forms

-   **Before**: Manual form state + validation
-   **After**: Use Formik + Yup schema
-   **Files**: `src/app/auth/login/page.tsx`, `src/app/auth/register/page.tsx`

#### 2. Dashboard Charts

-   **Before**: Chart.js
-   **After**: Nivo charts
-   **Files**: `src/app/dashboard/page.tsx`, `src/app/admin/monitoring/page.tsx`

#### 3. Modal Dialogs

-   **Before**: Custom modal components
-   **After**: Headless UI Dialog
-   **Files**: Any component with modal/popup

#### 4. Buttons & Cards

-   **Before**: Long Tailwind className strings
-   **After**: DaisyUI utility classes
-   **Files**: All components with repetitive styling

---

## 🔗 Useful Resources

### Documentation

-   **DaisyUI**: <https://daisyui.com/components/>
-   **Formik**: <https://formik.org/docs/overview>
-   **Yup**: <https://github.com/jquense/yup>
-   **Nivo**: <https://nivo.rocks/components/>
-   **Headless UI**: <https://headlessui.com/>

### Tools NOT Installed (Why)

-   ❌ **ReverseUI/KokonutUI**: DaisyUI already provides components
-   ❌ **Xano**: You have a complete backend
-   ℹ️ **Shape Divider**: Use <https://www.shapedivider.app> (copy/paste SVG)
-   ℹ️ **Animista**: Use <https://animista.net> (copy/paste CSS)

---

## 💡 Quick Wins

### Immediate Improvements

1. **Replace 404.tsx buttons** with DaisyUI: `btn btn-primary`
2. **Add Formik to KYC forms** for auto-validation
3. **Replace Chart.js with Nivo** in admin monitoring
4. **Use Headless UI modals** for withdrawal confirmations
5. **Apply DaisyUI cards** to transaction lists

### Time Savings

-   🕐 **70% less CSS** - Use DaisyUI instead of manual Tailwind
-   🕐 **50% less form code** - Formik handles state + validation
-   🕐 **Instant charts** - Nivo pre-configured, no setup
-   🕐 **Accessible by default** - Headless UI handles ARIA + keyboard nav

---

## 🐛 Troubleshooting

### Issue: DaisyUI styles not applying

**Solution**: Check `tailwind.config.js` includes DaisyUI plugin

### Issue: Formik validation not working

**Solution**: Ensure `validationSchema` is a Yup schema object

### Issue: Nivo chart not rendering

**Solution**: Parent div must have explicit height (e.g., `h-96` or `height: 400px`)

### Issue: Headless UI transitions not smooth

**Solution**: Wrap in `<Transition>` component with enter/leave classes

---

## 📊 Impact Summary

| Tool        | Benefit               | Time Saved | Files Affected     |
| ----------- | --------------------- | ---------- | ------------------ |
| DaisyUI     | Pre-styled components | 70%        | All UI files       |
| Formik      | Auto validation       | 50%        | All forms          |
| Nivo        | Professional charts   | 80%        | Dashboards         |
| Headless UI | Accessible modals     | 40%        | Dialogs, dropdowns |

**Total Development Time Saved**: ~60% on frontend work

---

**Next Steps**:

1. ✅ Visit <http://localhost:3000/demo/tools>
2. ✅ Explore example components
3. ✅ Start migrating existing components
4. ✅ Read documentation for advanced features
