import zipfile, re
with zipfile.ZipFile('cahier_des_charges_rdv_academique_v2.docx') as z:
    data = z.read('word/document.xml').decode('utf-8')
    texts = re.findall(r'<w:t[^>]*>(.*?)</w:t>', data)
    print('\n'.join(texts))
