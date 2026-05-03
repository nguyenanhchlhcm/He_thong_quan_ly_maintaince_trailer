# **AI SYSTEM RULES: TRUCK & TRAILER MAINTENANCE (WEB APP)**

**Instructions for AI Agent:** These are the immutable constraints for the Web App Fleet Maintenance System. You MUST load these into your system instructions. NEVER override these rules when generating Next.js components, APIs, or Supabase schemas.

\<strict\_rules\_and\_constraints\>

* **RULE 1: ANTI-FRAUD (VISUAL PROOF IS MANDATORY):** Mechanics MUST upload photos of both OLD and NEW parts. Database columns anh\_vat\_tu\_cu\_url and anh\_vat\_tu\_moi\_url in CHI\_TIET\_VAT\_TU\_SU\_DUNG MUST always be NOT NULL. Frontend forms MUST require these files.  
* **RULE 2: GPS VERIFICATION & FLAG:** Never trust user input for location. Always capture toa\_do\_app\_lat and lng implicitly via browser Geolocation API. Calculate Haversine distance against toa\_do\_xe\_lat/lng. If distance \> 1km, MUST set canh\_bao\_gps \= true.  
* **RULE 3: COST INTEGRITY (IMMUTABLE TOTALS):** tong\_chi\_phi and tong\_vat\_tu MUST NOT be calculated on the frontend and submitted directly. They MUST be calculated and strictly enforced via Supabase Database Triggers (Auto\_Calculate\_Totals).  
* **RULE 4: APPROVAL WORKFLOW INTEGRITY:** If a maintenance ticket (PHIEU\_BAO\_TRI) is modified (parts added/removed) causing the cost to change, a Supabase Trigger (Reset\_Status\_On\_Cost\_Change) MUST automatically revert the trang\_thai\_phieu to "Báo giá" to force re-approval by the Manager.  
* **RULE 5: TIRE LIFECYCLE STRICTNESS:** A tire (id\_vo) represents a unique physical asset (Serial Number). It MUST NEVER be duplicated. To change a tire's location, use an UPDATE statement on vi\_tri\_lap. DO NOT use INSERT.  
* **RULE 6: OFFLINE-FIRST ARCHITECTURE:** Mechanics work under trucks. You MUST implement IndexedDB (using localforage or similar) to save PHIEU\_BAO\_TRI form state locally. Sync to Supabase only when navigator.onLine is true.  
* **RULE 7: PREVENT DATA BLOAT:** You MUST implement client-side image compression (e.g., using browser-image-compression) to resize images to max 800x800px WebP format BEFORE uploading to Supabase Storage.  
  \</strict\_rules\_and\_constraints\>