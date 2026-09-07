const fs = require('fs');
let code = fs.readFileSync('src/components/UserManagementModal.tsx', 'utf8');

code = code.replace(
  "    } catch (err) {\n      console.error(err);\n    }\n  };\n\n  const handleDelete",
  "    } catch (err: any) {\n      console.error(err);\n      alert('เพิ่มผู้ใช้ล้มเหลว: ' + err.message);\n    }\n  };\n\n  const handleDelete"
);

code = code.replace(
  "    } catch (err) {\n      console.error(err);\n      alert('เปลี่ยนรหัสผ่านล้มเหลว');\n    }\n  };\n\n  return (",
  "    } catch (err: any) {\n      console.error(err);\n      alert('เปลี่ยนรหัสผ่านล้มเหลว: ' + err.message);\n    }\n  };\n\n  return ("
);

fs.writeFileSync('src/components/UserManagementModal.tsx', code);
console.log("Patched UserManagementModal error handling");
