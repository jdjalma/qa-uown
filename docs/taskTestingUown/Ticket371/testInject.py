# Cria arquivo vazio em /tmp (Linux/Mac) ou C:\Temp (Windows)
import os
try:
    open('/tmp/testando_injecao_py.txt', 'w').close()
except:
    open('C:\\Temp\\testando_injecao_py.txt', 'w').close()