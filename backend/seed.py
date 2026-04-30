"""
Trakvora full-database seed — ~10 entries per table.
Run:  docker compose exec backend python seed.py

Idempotent: checks existence before inserting; re-running is safe.
Password for all seed accounts: Test1234!
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone

import asyncpg
import bcrypt

DSN = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://trakvora:trakvora@db:5432/trakvora",
).replace("postgresql+asyncpg://", "postgresql://")

PW = bcrypt.hashpw(b"Test1234!", bcrypt.gensalt()).decode()
ADMIN_PW = bcrypt.hashpw(b"Trakvora@1", bcrypt.gensalt()).decode()
ADMIN_ID = uuid.UUID("ffffffff-0000-0000-0000-000000000001")

# ── Kenyan corridors & coordinates ─────────────────────────────────────────
LOCATIONS = {
    "Nairobi ICD":        (-1.3192,  36.9283),
    "Nairobi Industrial": (-1.3031,  36.8602),
    "Nairobi Westlands":  (-1.2673,  36.8114),
    "Mombasa Port":       (-4.0435,  39.6682),
    "Mombasa Shimanzi":   (-4.0600,  39.6500),
    "Kisumu Kondele":     (-0.0917,  34.7680),
    "Eldoret Langas":     ( 0.5143,  35.2698),
    "Nakuru CBD":         (-0.3031,  36.0800),
    "Kampala Nakawa":     ( 0.3317,  32.6136),
    "Dar es Salaam":      (-6.7924,  39.2083),
    "Arusha":             (-3.3869,  36.6830),
}


async def upsert_user(conn, uid, email, full_name, role, company=None, phone=None,
                      rating=4.5, trips=0, verified=True):
    exists = await conn.fetchval("SELECT id FROM users WHERE email=$1", email)
    if exists:
        await conn.execute(
            """UPDATE users SET full_name=$2, company_name=$3, phone=$4,
               is_verified=$5, rating=$6, total_trips=$7 WHERE email=$1""",
            email, full_name, company, phone, verified, rating, trips,
        )
        return exists
    await conn.execute(
        """INSERT INTO users
           (id,email,full_name,company_name,hashed_password,role,phone,
            is_active,is_verified,rating,total_trips,created_at,updated_at)
           VALUES($1,$2,$3,$4,$5,$6::userrole,$7,true,$8,$9,$10,NOW(),NOW())""",
        uid, email, full_name, company, PW, role, phone, verified, rating, trips,
    )
    return uid


async def seed(conn: asyncpg.Connection) -> None:

    # ── 1. USERS ────────────────────────────────────────────────────────────
    print("\n── Users ──")
    # Pre-defined IDs so foreign keys are stable across re-runs
    u = {
        "shipper1": uuid.UUID("718750b8-f797-4183-807f-cc19793e8418"),  # existing Amina
        "owner1":   uuid.UUID("1a61ded8-d63b-45e7-ade2-2f51bae64c86"),  # existing James
        "driver1":  uuid.UUID("50c1abea-fde2-4e22-bc93-bde9023697d5"),  # existing Brian
        "shipper2": uuid.UUID("aaaaaaaa-0001-0001-0001-000000000001"),
        "shipper3": uuid.UUID("aaaaaaaa-0001-0001-0001-000000000002"),
        "owner2":   uuid.UUID("aaaaaaaa-0001-0001-0001-000000000003"),
        "driver2":  uuid.UUID("aaaaaaaa-0001-0001-0001-000000000004"),
        "driver3":  uuid.UUID("aaaaaaaa-0001-0001-0001-000000000005"),
        "driver4":  uuid.UUID("aaaaaaaa-0001-0001-0001-000000000006"),
        "driver5":  uuid.UUID("aaaaaaaa-0001-0001-0001-000000000007"),
        "driver6":  uuid.UUID("aaaaaaaa-0001-0001-0001-000000000008"),
        "driver7":  uuid.UUID("aaaaaaaa-0001-0001-0001-000000000009"),
        "driver8":  uuid.UUID("aaaaaaaa-0001-0001-0001-000000000010"),
        "driver9":  uuid.UUID("aaaaaaaa-0001-0001-0001-000000000011"),
    }

    # ── Admin user ──────────────────────────────────────────────────────────
    admin_exists = await conn.fetchval("SELECT id FROM users WHERE email='admin@trakvora.com'")
    if not admin_exists:
        await conn.execute(
            """INSERT INTO users (id,email,full_name,hashed_password,role,phone,
               is_active,is_verified,rating,total_trips,cancellation_count,created_at,updated_at)
               VALUES($1,$2,$3,$4,$5::userrole,$6,true,true,0.0,0,0,NOW(),NOW())""",
            ADMIN_ID, "admin@trakvora.com", "Platform Admin", ADMIN_PW, "admin", "+254700000099",
        )
        print("  ✓ admin@trakvora.com created (Trakvora@1)")
    else:
        print("  – admin user already exists")

    await upsert_user(conn, u["shipper1"], "zacthuku7@gmail.com",  "Amina Hassan",     "shipper", "Harambee Traders Ltd",  "+254700100001", 4.7, 23)
    await upsert_user(conn, u["owner1"],   "fleet@gmail.com",      "James Kamau",      "owner",   "Kamau Haulage Ltd",     "+254700100002", 4.5, 47)
    await upsert_user(conn, u["driver1"],  "driver@gmail.com",     "Brian Otieno",     "driver",  None,                    "+254700100003", 4.8, 31)
    await upsert_user(conn, u["shipper2"], "shipper2@trakvora.dev","Ng'ang'a Waweru",  "shipper", "Waweru Exports Ltd",    "+254700200001", 4.3, 15)
    await upsert_user(conn, u["shipper3"], "shipper3@trakvora.dev","Zawadi Traders",   "shipper", "Zawadi Agri Supplies",  "+254700200002", 4.6, 8)
    await upsert_user(conn, u["owner2"],   "owner2@trakvora.dev",  "Fatuma Abubakar",  "owner",   "Fatuma Transport Co",   "+254700200003", 4.4, 62)
    await upsert_user(conn, u["driver2"],  "driver2@trakvora.dev", "David Kariuki",    "driver",  None,                    "+254700300001", 4.6, 19)
    await upsert_user(conn, u["driver3"],  "driver3@trakvora.dev", "Lucy Njeri",       "driver",  None,                    "+254700300002", 4.9, 44)
    await upsert_user(conn, u["driver4"],  "driver4@trakvora.dev", "Peter Omondi",     "driver",  None,                    "+254700300003", 4.2, 27)
    await upsert_user(conn, u["driver5"],  "driver5@trakvora.dev", "Grace Achieng",    "driver",  None,                    "+254700300004", 4.7, 38)
    await upsert_user(conn, u["driver6"],  "driver6@trakvora.dev", "John Mutua",       "driver",  None,                    "+254700300005", 4.5, 22)
    await upsert_user(conn, u["driver7"],  "driver7@trakvora.dev", "Mary Wanjiku",     "driver",  None,                    "+254700300006", 4.8, 55)
    await upsert_user(conn, u["driver8"],  "driver8@trakvora.dev", "Joseph Kimani",    "driver",  None,                    "+254700300007", 4.3, 11)
    await upsert_user(conn, u["driver9"],  "driver9@trakvora.dev", "Emmanuel Kibet",   "driver",  None,                    "+254700300008", 4.6, 33)
    print(f"  ✓ {len(u)} users ready")

    # ── 2. DRIVERS ──────────────────────────────────────────────────────────
    print("\n── Drivers ──")
    driver_profiles = [
        # (user_key, licence, class, expiry, bio, yrs, routes, types, status, location, seeking, verified)
        ("driver1", "A123456/2018", "CE", "2027-06-30",
         "8 years on EA corridors. Specialise in flatbed and dry van. NTSA verified.",
         8, "Nairobi-Mombasa, Nairobi-Kampala", "flatbed, dry_van", "available", "Nairobi", True, True),
        ("driver2", "B234567/2019", "BCE", "2026-12-31",
         "Cross-border specialist with 5 years experience on TZ and UG corridors.",
         5, "Nairobi-Kampala, Nairobi-Arusha", "dry_van, reefer", "available", "Nairobi", True, True),
        ("driver3", "C345678/2020", "CE", "2028-03-15",
         "Refrigerated cargo expert. Handled pharma and perishables across East Africa.",
         7, "Nairobi-Mombasa, Mombasa-Dar es Salaam", "reefer", "available", "Mombasa", False, True),
        ("driver4", "D456789/2017", "C",  "2025-09-30",
         "Tipper and tanker specialist for construction and fuel logistics.",
         10, "Nairobi-Nakuru, Nairobi-Eldoret", "tipper, tanker", "offline", "Nakuru", True, False),
        ("driver5", "E567890/2021", "BCE", "2029-01-01",
         "Young licensed driver with clean safety record. Open to fleet employment.",
         3, "Nairobi-Kisumu, Kisumu-Kampala", "flatbed", "available", "Kisumu", True, True),
        ("driver6", "F678901/2018", "CE", "2027-11-30",
         "Tipper and lowbed expert. 6 years in mining and construction haulage.",
         6, "Nairobi-Eldoret, Eldoret-Kampala", "lowbed, tipper", "on_job", "Eldoret", False, True),
        ("driver7", "G789012/2016", "CE", "2026-06-30",
         "15 years experience, specialised in hazardous materials. Full KEBS certified.",
         15, "Nairobi-Mombasa, Nairobi-Kampala", "tanker, flatbed", "available", "Nairobi", False, True),
        ("driver8", "H890123/2022", "B",  "2030-02-28",
         "New entrant with 2 years driving experience. Eager and punctual.",
         2, "Nairobi-Nakuru", "dry_van", "available", "Nairobi", True, False),
        ("driver9", "I901234/2019", "CE", "2027-08-31",
         "Long-haul specialist with Uganda and Tanzania cross-border permits.",
         9, "Nairobi-Kampala, Nairobi-Arusha", "dry_van, reefer, flatbed", "available", "Nairobi", True, True),
    ]
    driver_ids = {}
    for (dk, lic, cls, exp, bio, yrs, routes, types, status, loc, seeking, ntsa) in driver_profiles:
        uid = u[dk]
        row = await conn.fetchrow("SELECT id FROM drivers WHERE user_id=$1", uid)
        if row:
            driver_ids[dk] = row["id"]
            await conn.execute(
                """UPDATE drivers SET licence_number=$2,licence_class=$3,licence_expiry=$4,
                   bio=$5,experience_years=$6,preferred_routes=$7,preferred_truck_types=$8,
                   availability_status=$9::availabilitystatus,availability_location=$10,
                   seeking_employment=$11,verification_status=$12::verificationstatus,
                   ntsa_verified=$13,updated_at=NOW() WHERE user_id=$1""",
                uid, lic, cls, exp, bio, yrs, routes, types, status, loc, seeking,
                "approved" if ntsa else "pending", ntsa,
            )
        else:
            did = uuid.uuid4()
            driver_ids[dk] = did
            await conn.execute(
                """INSERT INTO drivers
                   (id,user_id,licence_number,licence_class,licence_expiry,bio,
                    experience_years,preferred_routes,preferred_truck_types,
                    availability_status,availability_location,seeking_employment,
                    verification_status,ntsa_verified,created_at,updated_at)
                   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::availabilitystatus,$11,$12,
                          $13::verificationstatus,$14,NOW(),NOW())""",
                did, uid, lic, cls, exp, bio, yrs, routes, types, status, loc, seeking,
                "approved" if ntsa else "pending", ntsa,
            )
    print(f"  ✓ {len(driver_profiles)} driver profiles ready")

    # ── 3. TRUCKS ───────────────────────────────────────────────────────────
    print("\n── Trucks ──")
    trucks_data = [
        # (reg, owner_key, type, cap, make, model, year, driver_owned, assign_driver_key)
        ("KCA 001A", "owner1",  "flatbed", 30, "Scania",         "R450",        2019, False, "driver1"),
        ("KCB 002B", "owner1",  "dry_van", 25, "Mercedes-Benz",  "Actros 2545", 2020, False, "driver2"),
        ("KCC 003C", "owner1",  "tipper",  10, "Isuzu",          "NQR 500",     2018, False, None),
        ("KCD 004D", "owner1",  "reefer",  22, "Volvo",          "FH 500",      2021, False, "driver3"),
        ("KCE 005E", "owner1",  "tanker",  20, "MAN",            "TGS 26.440",  2018, False, None),
        ("KDA 100X", "driver1", "flatbed",  8, "Mitsubishi",     "Fuso FJ",     2017, True,  None),
        ("KFA 200A", "owner2",  "flatbed", 30, "Scania",         "P410",        2020, False, "driver5"),
        ("KFB 201B", "owner2",  "dry_van", 28, "DAF",            "XF 530",      2021, False, "driver6"),
        ("KFC 202C", "owner2",  "reefer",  24, "Volvo",          "FM 500",      2022, False, None),
        ("KGA 300D", "driver7", "flatbed",  5, "Toyota",         "Dyna 150",    2015, True,  None),
    ]
    truck_ids = {}
    for (reg, ok, ttype, cap, make, model, year, drv_owned, assign_dk) in trucks_data:
        row = await conn.fetchrow("SELECT id FROM trucks WHERE registration_number=$1", reg)
        if row:
            truck_ids[reg] = row["id"]
            print(f"  – {reg} exists")
            continue
        tid = uuid.uuid4()
        truck_ids[reg] = tid
        assigned = driver_ids.get(assign_dk) if assign_dk else None
        await conn.execute(
            """INSERT INTO trucks
               (id,owner_id,registration_number,truck_type,capacity_tonnes,
                make,model,year,is_active,is_driver_owned,assigned_driver_id,created_at,updated_at)
               VALUES($1,$2,$3,$4::trucktype,$5,$6,$7,$8,true,$9,$10,NOW(),NOW())""",
            tid, u[ok], reg, ttype, float(cap), make, model, year, drv_owned, assigned,
        )
        print(f"  ✓ {reg} created")

    # ── 4. LOADS ────────────────────────────────────────────────────────────
    print("\n── Loads ──")
    loads_data = [
        # (shipper_key, pickup, dropoff, corridor, cargo, weight, desc, price, mode, status, distance, date)
        ("shipper1", "Nairobi ICD",        "Mombasa Port",     "Nairobi-Mombasa",
         "general",      28, "20 pallets packaged consumer goods",           145000, "auction",  "available",  485, "2026-05-08"),
        ("shipper2", "Nairobi Industrial", "Kampala Nakawa",   "Nairobi-Kampala",
         "construction",  35, "Steel rods and construction hardware — flatbed req'd", 210000, "fixed", "available", 680, "2026-05-10"),
        ("shipper3", "Mombasa Shimanzi",   "Nairobi Westlands","Nairobi-Mombasa",
         "refrigerated",  18, "Fresh fish and seafood. 2–4°C required.",      185000, "auction",  "available",  485, "2026-05-07"),
        ("shipper1", "Eldoret Langas",     "Nairobi Industrial","Nairobi-Eldoret",
         "agricultural",  20, "Bulk maize grain in 90 kg bags. 222 bags.",     98000, "fixed",    "available",  320, "2026-05-09"),
        ("shipper2", "Kisumu Kondele",     "Nairobi Westlands","Nairobi-Kisumu",
         "general",       15, "Assorted household goods in crates.",            72000, "auction",  "bidding",    350, "2026-05-06"),
        # Booked / in-transit loads (will get shipments)
        ("shipper1", "Nairobi ICD",        "Dar es Salaam",    "Mombasa-Dar es Salaam",
         "electronics",   12, "Consumer electronics in cartons. High value.",  320000, "fixed",    "in_transit", 1150, "2026-04-30"),
        ("shipper3", "Nakuru CBD",         "Kampala Nakawa",   "Nairobi-Kampala",
         "agricultural",  25, "Processed tea. Export grade, 500 kg bales.",    160000, "fixed",    "in_transit", 590, "2026-04-29"),
        ("shipper2", "Nairobi Industrial", "Arusha",           "Nairobi-Arusha",
         "construction",  30, "Pre-fabricated steel beams. Lowbed required.",  195000, "fixed",    "booked",     280, "2026-05-02"),
        ("shipper1", "Mombasa Port",       "Nairobi Westlands","Nairobi-Mombasa",
         "general",       22, "Imported textiles and clothing.",                115000, "fixed",    "booked",     485, "2026-05-03"),
        # Delivered loads
        ("shipper3", "Nairobi ICD",        "Mombasa Port",     "Nairobi-Mombasa",
         "general",       18, "Export coffee beans in 60 kg jute bags.",        88000, "fixed",    "delivered",  485, "2026-04-20"),
    ]
    load_ids = []
    existing_count = await conn.fetchval(
        "SELECT COUNT(*) FROM loads WHERE shipper_id = ANY($1::uuid[])",
        [u["shipper1"], u["shipper2"], u["shipper3"]],
    )
    if existing_count and existing_count >= len(loads_data):
        load_ids = [r["id"] for r in await conn.fetch(
            "SELECT id FROM loads WHERE shipper_id = ANY($1::uuid[]) ORDER BY created_at LIMIT $2",
            [u["shipper1"], u["shipper2"], u["shipper3"]], len(loads_data),
        )]
        print(f"  – {len(load_ids)} loads already exist, skipping")
    else:
        # Clear existing seed loads to avoid partial state
        await conn.execute(
            "DELETE FROM loads WHERE shipper_id = ANY($1::uuid[])",
            [u["shipper1"], u["shipper2"], u["shipper3"]],
        )
        for (sk, pickup, dropoff, corridor, cargo, weight, desc, price, mode, status, dist, date) in loads_data:
            plat, plng = LOCATIONS[pickup]
            dlat, dlng = LOCATIONS[dropoff]
            lid = uuid.uuid4()
            load_ids.append(lid)
            await conn.execute(
                """INSERT INTO loads
                   (id,shipper_id,pickup_location,pickup_latitude,pickup_longitude,
                    dropoff_location,dropoff_latitude,dropoff_longitude,corridor,
                    cargo_type,weight_tonnes,cargo_description,price_kes,
                    booking_mode,status,distance_km,pickup_date,created_at,updated_at)
                   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,
                          $10::cargotype,$11,$12,$13,$14::bookingmode,
                          $15::loadstatus,$16,$17,NOW(),NOW())""",
                lid, u[sk], pickup, plat, plng, dropoff, dlat, dlng, corridor,
                cargo, float(weight), desc, float(price), mode, status, float(dist), date,
            )
        print(f"  ✓ {len(load_ids)} loads created")

    # ── 5. BIDS ─────────────────────────────────────────────────────────────
    print("\n── Bids ──")
    existing_bids = await conn.fetchval("SELECT COUNT(*) FROM bids")
    if existing_bids and existing_bids >= 8:
        print(f"  – {existing_bids} bids already exist, skipping")
    else:
        # Bids on the first 5 available/bidding loads
        bids_data = [
            (0, "owner1", "KCA 001A", 138000, "pending",  "Reliable flatbed. Nairobi-Mombasa specialist."),
            (0, "owner2", "KFA 200A", 142000, "pending",  "GPS tracked. Available immediately."),
            (1, "owner1", "KCB 002B", 200000, "accepted", "Dry van, good condition, cross-border permits ready."),
            (1, "owner2", "KFB 201B", 205000, "rejected", "DAF XF. Will load next-day."),
            (2, "owner1", "KCD 004D", 178000, "pending",  "Reefer unit. 2°C–8°C precision temp control."),
            (3, "owner2", "KFA 200A", 92000,  "pending",  "Maize corridor specialist. 320 km run."),
            (4, "owner1", "KCA 001A", 68000,  "pending",  "Kisumu run, quick turnaround."),
            (4, "owner2", "KFB 201B", 71000,  "pending",  "Covered van, goods protected."),
            (0, "owner1", "KCE 005E", 140000, "withdrawn","Changed availability."),
            (2, "owner2", "KFC 202C", 182000, "pending",  "Reefer — maintaining 3°C en route."),
        ]
        for (li, ok, reg, amount, status, msg) in bids_data:
            if li >= len(load_ids):
                continue
            await conn.execute(
                """INSERT INTO bids
                   (id,load_id,owner_id,truck_id,amount_kes,status,message,created_at,updated_at)
                   VALUES($1,$2,$3,$4,$5,$6::bidstatus,$7,NOW(),NOW())""",
                uuid.uuid4(), load_ids[li], u[ok], truck_ids[reg],
                float(amount), status, msg,
            )
        print(f"  ✓ {len(bids_data)} bids created")

    # ── 6. SHIPMENTS ────────────────────────────────────────────────────────
    print("\n── Shipments ──")
    existing_ships = await conn.fetchval("SELECT COUNT(*) FROM shipments")
    shipment_ids = []
    if existing_ships and existing_ships >= 5:
        shipment_ids = [r["id"] for r in await conn.fetch("SELECT id FROM shipments ORDER BY created_at")]
        print(f"  – {len(shipment_ids)} shipments exist, skipping")
    else:
        # loads_data indices 5-9 are in_transit / booked / delivered
        shipment_specs = [
            # (load_idx, truck_reg, driver_key, owner_key, status, escrow_locked, escrow_released, lat, lng)
            (5, "KCB 002B", "driver2", "owner1", "in_transit", True,  False, -3.0,   37.0),
            (6, "KCD 004D", "driver3", "owner1", "in_transit", True,  False, -1.5,   37.2),
            (7, "KFA 200A", "driver5", "owner2", "booked",     True,  False, None,   None),
            (8, "KCA 001A", "driver1", "owner1", "booked",     True,  False, None,   None),
            (9, "KCB 002B", "driver2", "owner1", "delivered",  True,  True,  None,   None),
            # Extra shipments to round up
            (4, "KFB 201B", "driver6", "owner2", "en_route_pickup", True, False, -1.28, 36.82),
        ]
        for (li, reg, dk, ok, status, e_lock, e_rel, lat, lng) in shipment_specs:
            if li >= len(load_ids):
                continue
            load_id = load_ids[li]
            exists = await conn.fetchval("SELECT id FROM shipments WHERE load_id=$1", load_id)
            if exists:
                shipment_ids.append(exists)
                continue
            sid = uuid.uuid4()
            shipment_ids.append(sid)
            delivered_at = datetime.now(timezone.utc) if status == "delivered" else None
            await conn.execute(
                """INSERT INTO shipments
                   (id,load_id,truck_id,driver_id,owner_id,status,
                    escrow_locked,escrow_released,current_latitude,current_longitude,
                    delivered_at,created_at,updated_at)
                   VALUES($1,$2,$3,$4,$5,$6::loadstatus,$7,$8,$9,$10,$11,NOW(),NOW())""",
                sid, load_id, truck_ids[reg], u[dk], u[ok], status,
                e_lock, e_rel, lat, lng, delivered_at,
            )
        print(f"  ✓ {len(shipment_ids)} shipments created")

    # ── 7. CONSIGNMENT NOTES ────────────────────────────────────────────────
    print("\n── Consignment Notes ──")
    existing_cn = await conn.fetchval("SELECT COUNT(*) FROM consignment_notes")
    if existing_cn and existing_cn >= len(shipment_ids):
        print(f"  – {existing_cn} consignment notes exist, skipping")
    else:
        for i, sid in enumerate(shipment_ids):
            exists = await conn.fetchval(
                "SELECT id FROM consignment_notes WHERE shipment_id=$1", sid
            )
            if exists:
                continue
            ref = f"TKV-{2026040 + i:07d}"
            # Fetch shipment load details for cargo description
            ship = await conn.fetchrow(
                "SELECT l.cargo_description, l.cargo_type, l.weight_tonnes FROM shipments s "
                "JOIN loads l ON s.load_id = l.id WHERE s.id = $1", sid
            )
            cargo_detail = (
                f"Cargo: {ship['cargo_type']} | Weight: {ship['weight_tonnes']}t | "
                f"Details: {ship['cargo_description']}"
            ) if ship else "General cargo"
            await conn.execute(
                """INSERT INTO consignment_notes
                   (id,shipment_id,reference_number,cargo_details,
                    shipper_accepted,owner_accepted,driver_accepted,created_at,updated_at)
                   VALUES($1,$2,$3,$4,true,true,true,NOW(),NOW())""",
                uuid.uuid4(), sid, ref, cargo_detail,
            )
        print(f"  ✓ {len(shipment_ids)} consignment notes ready")

    # ── 8. RETURN WINDOWS ───────────────────────────────────────────────────
    print("\n── Return Windows ──")
    existing_rw = await conn.fetchval("SELECT COUNT(*) FROM return_windows")
    if existing_rw and existing_rw >= 8:
        print(f"  – {existing_rw} return windows exist, skipping")
    else:
        rw_data = [
            # (driver_key, truck_reg, origin, destination, from, until, cap, notes)
            ("driver1","KCA 001A","Mombasa Port",      "Nairobi ICD",        "2026-05-09","2026-05-11",28,"Full load preferred. Any cargo."),
            ("driver2","KCB 002B","Kampala Nakawa",    "Nairobi Industrial", "2026-05-12","2026-05-14",22,"Dry van. Cross-border cleared."),
            ("driver3","KCD 004D","Dar es Salaam",     "Mombasa Shimanzi",   "2026-05-08","2026-05-09",20,"Reefer available. Cold chain maintained."),
            ("driver5","KFA 200A","Kampala Nakawa",    "Nairobi ICD",        "2026-05-11","2026-05-13",28,"Return haul. Flexible on cargo type."),
            ("driver6","KFB 201B","Arusha",            "Nairobi Industrial", "2026-05-05","2026-05-07",25,"DAF XF dry van. Goods in transit."),
            ("driver7","KGA 300D","Nairobi Westlands", "Kisumu Kondele",     "2026-05-10","2026-05-11", 5,"Light flatbed. Small loads welcome."),
            ("driver4","KCC 003C","Eldoret Langas",    "Nairobi Industrial", "2026-05-09","2026-05-10",10,"Tipper. Sand/gravel/aggregate loads."),
            ("driver8","KCE 005E","Nakuru CBD",        "Nairobi ICD",        "2026-05-06","2026-05-07",18,"Tanker. Fuel or water bulk."),
            ("driver9","KCA 001A","Mombasa Port",      "Nairobi Westlands",  "2026-05-13","2026-05-15",28,"Experienced long-haul. Immediate availability."),
            ("driver1","KDA 100X","Mombasa Shimanzi",  "Nairobi Industrial", "2026-05-14","2026-05-15", 8,"Own truck flatbed. Partial loads OK."),
        ]
        for (dk, reg, orig, dest, frm, until, cap, notes) in rw_data:
            olat, olng = LOCATIONS[orig]
            dlat, dlng = LOCATIONS[dest]
            await conn.execute(
                """INSERT INTO return_windows
                   (id,driver_id,truck_id,origin_location,origin_latitude,origin_longitude,
                    destination_location,destination_latitude,destination_longitude,
                    available_from,available_until,capacity_tonnes,notes,is_active,created_at,updated_at)
                   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true,NOW(),NOW())""",
                uuid.uuid4(), u[dk], truck_ids[reg], orig, olat, olng,
                dest, dlat, dlng, frm, until, float(cap), notes,
            )
        print(f"  ✓ {len(rw_data)} return windows created")

    # ── 9. WALLETS ──────────────────────────────────────────────────────────
    print("\n── Wallets ──")
    wallet_ids = {}
    balances = {
        "shipper1": (285000, 145000), "shipper2": (120000,  72000), "shipper3": (75000, 0),
        "owner1":   (420000, 210000), "owner2":   (310000, 195000),
        "driver1":  (48500,  0),      "driver2":  (32000,  0),      "driver3": (61000, 0),
        "driver4":  (18000,  0),      "driver5":  (9500,   0),      "driver6": (27000, 0),
        "driver7":  (74000,  0),      "driver8":  (5000,   0),      "driver9": (38000, 0),
    }
    for uk, (bal, escrow) in balances.items():
        uid = u[uk]
        row = await conn.fetchrow("SELECT id FROM wallets WHERE user_id=$1", uid)
        if row:
            wallet_ids[uk] = row["id"]
        else:
            wid = uuid.uuid4()
            wallet_ids[uk] = wid
            await conn.execute(
                """INSERT INTO wallets (id,user_id,balance_kes,escrow_kes,currency,created_at,updated_at)
                   VALUES($1,$2,$3,$4,'KES',NOW(),NOW())""",
                wid, uid, float(bal), float(escrow),
            )
    print(f"  ✓ {len(wallet_ids)} wallets ready")

    # ── 10. TRANSACTIONS ────────────────────────────────────────────────────
    print("\n── Transactions ──")
    existing_tx = await conn.fetchval("SELECT COUNT(*) FROM transactions")
    if existing_tx and existing_tx >= 8:
        print(f"  – {existing_tx} transactions exist, skipping")
    else:
        tx_data = [
            # (wallet_key, shipment_idx, type, amount, status, ref, desc)
            ("shipper1", 2,    "escrow_hold",    195000, "completed", "TXN-ESC-001", "Escrow locked: NBI→Arusha shipment"),
            ("shipper1", 3,    "escrow_hold",    115000, "completed", "TXN-ESC-002", "Escrow locked: MSA→NBI textiles"),
            ("shipper1", 4,    "escrow_release",  88000, "completed", "TXN-REL-001", "Payment released: NBI→MSA coffee delivery"),
            ("owner1",   4,    "payout",          79200, "completed", "TXN-PAY-001", "Payout: NBI→MSA coffee (after 10% fee)"),
            ("driver1",  4,    "payout",          35000, "completed", "TXN-PAY-002", "Driver payout: delivered coffee run"),
            ("owner1",   None, "top_up",         200000, "completed", "TXN-TOP-001", "Wallet top-up via M-Pesa"),
            ("shipper2", None, "top_up",         120000, "completed", "TXN-TOP-002", "Wallet top-up via bank transfer"),
            ("owner1",   0,    "platform_fee",    14500, "completed", "TXN-FEE-001", "Platform fee: NBI→MSA electronics load"),
            ("driver3",  None, "top_up",          61000, "completed", "TXN-TOP-003", "Driver earnings top-up"),
            ("shipper3", 1,    "escrow_hold",    160000, "completed", "TXN-ESC-003", "Escrow: tea export to Kampala"),
        ]
        for (wk, si, ttype, amount, status, ref, desc) in tx_data:
            ship_id = shipment_ids[si] if si is not None and si < len(shipment_ids) else None
            exists = await conn.fetchval("SELECT id FROM transactions WHERE reference=$1", ref)
            if exists:
                continue
            await conn.execute(
                """INSERT INTO transactions
                   (id,wallet_id,shipment_id,transaction_type,amount_kes,status,reference,description,created_at,updated_at)
                   VALUES($1,$2,$3,$4::transactiontype,$5,$6::transactionstatus,$7,$8,NOW(),NOW())""",
                uuid.uuid4(), wallet_ids[wk], ship_id, ttype, float(amount), status, ref, desc,
            )
        print(f"  ✓ {len(tx_data)} transactions created")

    # ── 11. NOTIFICATIONS ───────────────────────────────────────────────────
    print("\n── Notifications ──")
    existing_notif = await conn.fetchval("SELECT COUNT(*) FROM notifications")
    if existing_notif and existing_notif >= 8:
        print(f"  – {existing_notif} notifications exist, skipping")
    else:
        notif_data = [
            ("shipper1", "bid_received",      "New bid on your load",          "James Kamau placed a bid of KES 138,000 on your Nairobi→Mombasa load.", False, load_ids[0] if load_ids else None, "load"),
            ("shipper1", "bid_received",      "New bid on your load",          "Fatuma Transport bid KES 142,000 on your Nairobi→Mombasa load.", False, load_ids[0] if load_ids else None, "load"),
            ("owner1",   "bid_accepted",      "Your bid was accepted",         "Your bid of KES 200,000 on the Nairobi→Kampala load was accepted.", False, load_ids[1] if len(load_ids)>1 else None, "load"),
            ("owner2",   "bid_rejected",      "Bid not selected",              "Your bid on the Nairobi→Kampala steel load was not selected this time.", True,  load_ids[1] if len(load_ids)>1 else None, "load"),
            ("driver1",  "shipment_booked",   "New shipment assigned",         "You have been assigned to the Mombasa→Nairobi textiles shipment. Pickup: 3 May.", False, shipment_ids[3] if len(shipment_ids)>3 else None, "shipment"),
            ("driver2",  "in_transit",        "Shipment in transit",           "Your Nairobi→Electronics shipment is now in transit. ETA: 2 days.", True,  shipment_ids[0] if shipment_ids else None, "shipment"),
            ("shipper1", "delivered",         "Load delivered!",               "Your coffee export (TKV-2026044) has been delivered. Please confirm receipt.", False, shipment_ids[4] if len(shipment_ids)>4 else None, "shipment"),
            ("shipper1", "payment_released",  "Payment released",              "KES 88,000 has been released to the carrier. Transaction: TXN-REL-001.", True,  None, None),
            ("driver3",  "driver_en_route",   "You are en route to pickup",    "Status updated: en route to pickup in Nakuru for the tea export load.", True,  shipment_ids[1] if len(shipment_ids)>1 else None, "shipment"),
            ("owner1",   "consignment_signed","Consignment note signed",       "All parties have signed the consignment note TKV-2026044.", True,  shipment_ids[4] if len(shipment_ids)>4 else None, "shipment"),
        ]
        for (uk, ntype, title, body, is_read, ref_id, ref_type) in notif_data:
            await conn.execute(
                """INSERT INTO notifications
                   (id,user_id,notification_type,title,body,is_read,reference_id,reference_type,created_at,updated_at)
                   VALUES($1,$2,$3::notificationtype,$4,$5,$6,$7,$8,NOW(),NOW())""",
                uuid.uuid4(), u[uk], ntype, title, body, is_read, ref_id, ref_type,
            )
        print(f"  ✓ {len(notif_data)} notifications created")

    # ── Summary ─────────────────────────────────────────────────────────────
    print("\n── Counts ──")
    for table in ["users","drivers","trucks","loads","bids","shipments",
                  "consignment_notes","return_windows","wallets","transactions","notifications"]:
        n = await conn.fetchval(f"SELECT COUNT(*) FROM {table}")
        print(f"  {table:<22} {n:>3} rows")
    print("\n🎉  Seed complete!  (password for all seed accounts: Test1234!)")


async def main() -> None:
    conn = await asyncpg.connect(DSN)
    try:
        await seed(conn)
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
