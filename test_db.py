import psycopg2

passwords = ["postgres", "", "password", "root", None]

for p in passwords:
    try:
        kwargs = {
            "dbname": "lenny_assistant",
            "user": "postgres",
            "host": "127.0.0.1",
            "port": "5432"
        }
        if p is not None:
            kwargs["password"] = p
            
        print(f"Trying password '{p}'...")
        conn = psycopg2.connect(**kwargs)
        print(f"SUCCESS with password: '{p}'")
        conn.close()
        break
    except Exception as e:
        print(f"Failed: {e}")
